// 다크모드 토글 기능
const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  React.useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <button
      className='theme-toggle'
      onClick={() => setIsDarkMode(!isDarkMode)}
      aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
};

const SkeletonLoader = () => {
  return (
    <div className='skeleton-container'>
      <div className='skeleton skeleton-title'></div>
      <div className='skeleton skeleton-line'></div>
      <div className='skeleton skeleton-line'></div>
      <div className='skeleton skeleton-button'></div>
    </div>
  );
};

const QuizApp = () => {
  const [loading, setLoading] = React.useState(true);
  const [quizList, setQuizList] = React.useState([]);
  const [selectedQuiz, setSelectedQuiz] = React.useState(null);
  const [quizData, setQuizData] = React.useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [score, setScore] = React.useState(0);
  const [showResults, setShowResults] = React.useState(false);
  const [userAnswers, setUserAnswers] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState(null);
  const [showContinueModal, setShowContinueModal] = React.useState(false);
  const [savedQuizProgress, setSavedQuizProgress] = React.useState(null);
  const [pendingQuizId, setPendingQuizId] = React.useState(null);

  React.useEffect(() => {
    fetch('quizzes.json')
      .then((response) => response.json())
      .then((data) => setQuizList(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // QuizApp 컴포넌트 수정 (내부에 키보드 단축키 지원 추가)
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedOption && !showExplanation) {
        // 1-4 키로 선택지 선택
        if (e.key >= '1' && e.key <= '4') {
          const options = ['①', '②', '③', '④'];
          handleOptionSelect(options[parseInt(e.key) - 1]);
        }
        // A-D 키로 선택지 선택
        else if (e.key.toLowerCase() >= 'a' && e.key.toLowerCase() <= 'd') {
          const options = ['①', '②', '③', '④'];
          handleOptionSelect(options[e.key.toLowerCase().charCodeAt(0) - 97]);
        }
      } else if (showExplanation && (e.key === ' ' || e.key === 'Enter')) {
        // 스페이스바나 엔터로 다음 문제
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption, showExplanation, currentQuestionIndex]);

  // 로컬 스토리지에 진행 상황 저장
  React.useEffect(() => {
    if (selectedQuiz && currentQuestionIndex > 0) {
      localStorage.setItem(
        'quizProgress',
        JSON.stringify({
          quizId: selectedQuiz,
          questionIndex: currentQuestionIndex,
          score,
          userAnswers,
        })
      );
    }
  }, [selectedQuiz, currentQuestionIndex, score, userAnswers]);

  // 로컬 스토리지에서 진행 상황 불러오기
  React.useEffect(() => {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
      const {
        quizId,
        questionIndex,
        score: savedScore,
        userAnswers: savedAnswers,
      } = JSON.parse(savedProgress);
      if (selectedQuiz === quizId) {
        setCurrentQuestionIndex(questionIndex);
        setScore(savedScore);
        setUserAnswers(savedAnswers);
      }
    }
  }, [selectedQuiz]);

  const loadQuiz = (quizId) => {
    const savedProgress = JSON.parse(localStorage.getItem('quizProgress'));

    if (savedProgress && savedProgress.quizId === quizId) {
      // 진행 중인 퀴즈가 있으면 모달 표시
      setShowContinueModal(true);
      setSavedQuizProgress(savedProgress); // 나중에 불러올 수 있도록 저장
      setPendingQuizId(quizId); // "아니오" 선택 시 새로운 퀴즈를 시작하기 위한 ID 저장
    } else {
      // 새 퀴즈 바로 시작
      startNewQuiz(quizId);
    }
  };

  // 기존 진행 상태에서 이어서 풀기
  const continueQuiz = () => {
    if (!savedQuizProgress) return;

    setShowContinueModal(false);
    setSelectedQuiz(savedQuizProgress.quizId);
    setCurrentQuestionIndex(savedQuizProgress.questionIndex);
    setScore(savedQuizProgress.score);
    setUserAnswers(savedQuizProgress.userAnswers);

    // 기존 방식 유지하면서 데이터 불러오기
    setLoading(true);
    fetch(`quiz-${savedQuizProgress.quizId}.json`)
      .then((response) => response.json())
      .then((data) => setQuizData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // 새로운 퀴즈 시작
  const startNewQuiz = (quizId) => {
    setShowContinueModal(false);
    setSelectedQuiz(quizId);
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswers([]);
    localStorage.removeItem('quizProgress'); // 기존 진행 데이터 삭제

    // 기존 방식 유지하면서 데이터 불러오기
    setLoading(true);
    fetch(`quiz-${quizId}.json`)
      .then((response) => response.json())
      .then((data) => setQuizData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleOptionSelect = (option) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const currentQuestion = quizData[currentQuestionIndex];
    const correct = option === currentQuestion.정답;

    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    setShowExplanation(true);

    setUserAnswers([
      ...userAnswers,
      {
        question: currentQuestion.문제,
        userAnswer: option,
        correctAnswer: currentQuestion.정답,
        isCorrect: correct,
        explanation: currentQuestion.해설 || null,
      },
    ]);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedOption(null);
    setIsCorrect(null);

    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResults(false);
    setUserAnswers([]);
    setShowExplanation(false);
    setIsCorrect(null);
  };

  if (!selectedQuiz) {
    return (
      <div className='container'>
        {showContinueModal && (
          <div className='modal'>
            <div className='modal-content'>
              <p>이어서 푸시겠습니까?</p>
              <div className='modal-buttons'>
                <button className='yes-button' onClick={continueQuiz}>
                  예
                </button>
                <button
                  className='no-button'
                  onClick={() => startNewQuiz(pendingQuizId)}
                >
                  아니오
                </button>
              </div>
            </div>
          </div>
        )}

        <div className='quiz-app'>
          <h1>문제지를 선택하세요</h1>
          {loading ? (
            <SkeletonLoader />
          ) : (
            <ul className='quiz-list'>
              {quizList.map((quiz) => (
                <li key={quiz.id}>
                  <button
                    className='btn btn-primary'
                    onClick={() => loadQuiz(quiz.id)}
                  >
                    {quiz.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <SkeletonLoader />;

  if (error) {
    return (
      <div className='container'>
        <div className='quiz-app'>
          <h1>오류 발생</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className='container'>
        <div className='quiz-app'>
          <h2>퀴즈 결과</h2>
          <div className='score'>
            {score} / {quizData.length}
          </div>
          <button className='btn btn-primary' onClick={handleRestart}>
            다시 시작하기
          </button>
          <div className='review-list'>
            {userAnswers.map((answer, index) => (
              <div
                key={index}
                className={`review-item ${
                  answer.isCorrect ? 'correct' : 'wrong'
                }`}
              >
                <div className='review-question'>
                  {index + 1}. {answer.question}
                </div>
                <div className='review-answer'>
                  <strong>내 답:</strong> {answer.userAnswer}
                  {!answer.isCorrect && (
                    <>
                      <strong>정답:</strong> {answer.correctAnswer}
                    </>
                  )}
                </div>
                {answer.explanation && (
                  <div className='explanation'>
                    <strong>해설:</strong> {answer.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];

  const quizTitle =
    quizList.find((quiz) => quiz.id === selectedQuiz)?.title ||
    `문제지: ${selectedQuiz}번`;

  return (
    <div className='container'>
      <div className='quiz-app'>
        <h1>{quizTitle}</h1>
        <div className='stats'>
          <div>
            문제 {currentQuestionIndex + 1} / {quizData.length}
          </div>
          <div>점수: {score}</div>
        </div>
        <div className='question'>
          <span className='question-number'>{currentQuestion.번호}.</span>{' '}
          {currentQuestion.문제}
        </div>
        <div className='options'>
          {Object.entries(currentQuestion.선택지).map(([key, value]) => {
            let optionClass = '';
            if (selectedOption) {
              if (key === selectedOption) {
                optionClass =
                  key === currentQuestion.정답 ? 'correct' : 'wrong';
              } else if (key === currentQuestion.정답) {
                optionClass = 'correct'; // 오답 선택 시 정답 강조
              }
            }
            return (
              <div
                key={key}
                className={`option ${optionClass}`}
                onClick={() => handleOptionSelect(key)}
              >
                <span className='option-label'>{key}</span> {value}
              </div>
            );
          })}
        </div>

        {showExplanation && (
          <div
            className={`feedback ${
              isCorrect ? 'correct-feedback' : 'wrong-feedback'
            }`}
          >
            {isCorrect ? '✅ 맞았습니다' : '❌ 틀렸습니다'}
          </div>
        )}

        {showExplanation && currentQuestion.해설 && (
          <div className='explanation'>
            <strong>해설:</strong> {currentQuestion.해설}
          </div>
        )}

        <button className='btn btn-primary' onClick={handleNextQuestion}>
          {currentQuestionIndex === quizData.length - 1
            ? '결과 보기'
            : '다음 문제'}
        </button>
      </div>
    </div>
  );
};

ReactDOM.render(<QuizApp />, document.getElementById('root'));
