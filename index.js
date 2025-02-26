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
  const [showModeModal, setShowModeModal] = React.useState(false);
  const [isRandomMode, setIsRandomMode] = React.useState(false);
  const [showFlashcards, setShowFlashcards] = React.useState(false);
  const [flashcardQuizId, setFlashcardQuizId] = React.useState(null);
  const [flashcardIndex, setFlashcardIndex] = React.useState(0);
  const [showAnswer, setShowAnswer] = React.useState(false);

  const quizResultRef = React.useRef(null);

  React.useEffect(() => {
    if (showResults) {
      setTimeout(() => {
        if (quizResultRef.current) {
          console.log(
            '🔍 quizResultRef가 정상적으로 설정됨:',
            quizResultRef.current
          );
        } else {
          console.error('🚨 quizResultRef가 설정되지 않음!');
        }
      }, 300);
    }
  }, [showResults]);

  const exportToPDF = () => {
    if (!quizResultRef.current) {
      console.error('🚨 quizResultRef가 설정되지 않았습니다! PDF 생성 취소');
      return;
    }

    const element = quizResultRef.current;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <html>
      <head>
        <title>퀴즈 결과</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .review-item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
          .correct { background-color: #d4edda; color: #155724; font-weight: bold; } /* 정답: 녹색 */
          .wrong { background-color: #f8d7da; color: #721c24; font-weight: bold; } /* 오답: 빨간색 */
          .explanation { font-style: italic; color: #333; margin-top: 5px; }
          .question { font-weight: bold; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>퀴즈 결과</h1>
        <p><strong>점수:</strong> ${score} / ${userAnswers.length}</p>
        <div class="review-list">
    `);

    userAnswers.forEach((answer, index) => {
      printWindow.document.write(`
        <div class="review-item ${answer.isCorrect ? 'correct' : 'wrong'}">
          <p class="question">${index + 1}. ${answer.question}</p>
          <p>내 답: <span class="${answer.isCorrect ? 'correct' : 'wrong'}">${
        answer.userAnswer
      }</span></p>
          ${
            !answer.isCorrect
              ? `<p>정답: <span class="correct">${answer.correctAnswer}</span></p>`
              : ''
          }
          ${
            answer.explanation
              ? `<p class="explanation">해설: ${answer.explanation}</p>`
              : ''
          }
        </div>
      `);
    });

    printWindow.document.write('</div></body></html>');
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

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

  // loadQuiz 함수 수정
  const loadQuiz = (quizId) => {
    const savedProgress = JSON.parse(localStorage.getItem('quizProgress'));

    if (savedProgress && savedProgress.quizId === quizId) {
      setShowContinueModal(true);
      setSavedQuizProgress(savedProgress);
      setPendingQuizId(quizId);
    } else {
      setShowModeModal(true);
      setPendingQuizId(quizId);
    }
  };

  // 새로운 함수 추가
  const startWithMode = (random) => {
    setIsRandomMode(random);
    setShowModeModal(false);
    startNewQuiz(pendingQuizId, random);
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

  // startNewQuiz 함수 수정
  const startNewQuiz = (quizId, random = false) => {
    setShowContinueModal(false);
    setSelectedQuiz(quizId);
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswers([]);
    localStorage.removeItem('quizProgress');

    setLoading(true);
    fetch(`quiz-${quizId}.json`)
      .then((response) => response.json())
      .then((data) => {
        // 랜덤 모드인 경우 문제 섞기
        if (random) {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setQuizData(shuffled);
        } else {
          setQuizData(data);
        }
      })
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

  const FlashcardMode = ({ quizData, onExit }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [flipped, setFlipped] = React.useState(false);

    const handleNext = () => {
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      }
    };

    const handlePrev = () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setFlipped(false);
      }
    };

    // 퀴즈 목록 화면 조건부 렌더링 수정
    if (!selectedQuiz && !showFlashcards) {
      return (
        <div className='container'>
          {/* 기존 모달들 */}

          <div className='quiz-app'>
            <h1>문제지를 선택하세요</h1>
            {loading ? (
              <SkeletonLoader />
            ) : (
              <>
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

                <div className='flashcard-section'>
                  <h2>플래시카드 모드</h2>
                  <ul className='quiz-list'>
                    {quizList.map((quiz) => (
                      <li key={`flashcard-${quiz.id}`}>
                        <button
                          className='btn btn-secondary'
                          onClick={() => startFlashcardMode(quiz.id)}
                        >
                          {quiz.title} - 플래시카드
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // 플래시카드 화면 추가
    if (showFlashcards) {
      return (
        <div className='container'>
          <div className='quiz-app'>
            <FlashcardMode
              quizData={quizData}
              onExit={() => setShowFlashcards(false)}
            />
          </div>
        </div>
      );
    }

    // 새 함수 추가
    const startFlashcardMode = (quizId) => {
      setFlashcardQuizId(quizId);
      setLoading(true);
      fetch(`quiz-${quizId}.json`)
        .then((response) => response.json())
        .then((data) => {
          setQuizData(data);
          setShowFlashcards(true);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };

    return (
      <div className='flashcard-container'>
        <h2>플래시카드 모드</h2>
        <div className='card-progress'>
          {currentIndex + 1} / {quizData.length}
        </div>

        <div
          className={`flashcard ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className='card-front'>
            <div className='question-number'>{quizData[currentIndex].번호}</div>
            <div className='question-text'>{quizData[currentIndex].문제}</div>
            <p className='flip-hint'>클릭하여 정답 보기</p>
          </div>
          <div className='card-back'>
            <p className='answer-label'>정답:</p>
            <p className='answer'>
              {quizData[currentIndex].정답}{' '}
              {quizData[currentIndex].선택지[quizData[currentIndex].정답]}
            </p>
            {quizData[currentIndex].해설 && (
              <div className='explanation'>
                <p className='explanation-label'>해설:</p>
                <p>{quizData[currentIndex].해설}</p>
              </div>
            )}
          </div>
        </div>

        <div className='flashcard-controls'>
          <button
            className='btn btn-secondary'
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            이전
          </button>
          <button className='btn btn-secondary' onClick={onExit}>
            종료
          </button>
          <button
            className='btn btn-primary'
            onClick={handleNext}
            disabled={currentIndex === quizData.length - 1}
          >
            다음
          </button>
        </div>
      </div>
    );
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
          {showModeModal && (
            <div className='modal'>
              <div className='modal-content'>
                <p>문제 풀이 모드를 선택하세요</p>
                <div className='modal-buttons'>
                  <button
                    className='yes-button'
                    onClick={() => startWithMode(false)}
                  >
                    순차 모드
                  </button>
                  <button
                    className='no-button'
                    onClick={() => startWithMode(true)}
                  >
                    랜덤 모드
                  </button>
                </div>
              </div>
            </div>
          )}
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

  // ✅ 결과 화면 렌더링 이후에 ref를 제대로 바인딩
  if (showResults) {
    return (
      <div className='container'>
        <div className='quiz-app' ref={quizResultRef}>
          <h2>퀴즈 결과</h2>
          <div className='score'>
            {score} / {userAnswers.length}
          </div>

          {/* ✅ 퀴즈 결과 리뷰 리스트 추가 */}
          <div className='review-list'>
            {userAnswers.map((answer, index) => (
              <div
                key={index}
                className={`review-item ${
                  answer.isCorrect ? 'correct' : 'wrong'
                }`}
              >
                <p className='question'>
                  {index + 1}. {answer.question}
                </p>
                <p>
                  내 답:{' '}
                  <span className={answer.isCorrect ? 'correct' : 'wrong'}>
                    {answer.userAnswer}{' '}
                    {
                      quizData[currentQuestionIndex]?.선택지?.[
                        answer.userAnswer
                      ]
                    }
                  </span>
                </p>

                {!answer.isCorrect && (
                  <p>
                    정답:{' '}
                    <span className='correct'>
                      {answer.correctAnswer}{' '}
                      {
                        quizData[currentQuestionIndex]?.선택지?.[
                          answer.correctAnswer
                        ]
                      }
                    </span>
                  </p>
                )}
                {answer.explanation && (
                  <p className='explanation'>
                    <strong>해설:</strong> {answer.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 결과 화면 버튼 */}
          <div className='result-buttons'>
            <button className='btn btn-primary' onClick={handleRestart}>
              다시 시작하기
            </button>
            <button className='btn btn-secondary' onClick={exportToPDF}>
              PDF로 내보내기
            </button>
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

        <div className='quiz-buttons'>
          <button
            className='btn btn-list'
            onClick={() => setSelectedQuiz(null)}
          >
            목차로
          </button>
          <button className='btn btn-primary' onClick={handleNextQuestion}>
            {currentQuestionIndex === quizData.length - 1
              ? '결과 보기'
              : '다음 문제'}
          </button>
          <button
            className='btn btn-secondary'
            onClick={() => setShowResults(true)}
          >
            풀이 중단하기
          </button>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<QuizApp />, document.getElementById('root'));
