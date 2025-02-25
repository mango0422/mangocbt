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

  React.useEffect(() => {
    fetch('quizzes.json')
      .then((response) => response.json())
      .then((data) => setQuizList(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadQuiz = (quizId) => {
    setLoading(true);
    setSelectedQuiz(quizId);
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

  return (
    <div className='container'>
      <div className='quiz-app'>
        <h1>문제지: {selectedQuiz}번</h1>
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
