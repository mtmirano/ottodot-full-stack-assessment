'use client'

import { useState } from 'react'

interface MathProblem {
  problem_text: string
  final_answer: number
  difficulty?: string
  problem_type?: string
}

interface HistoryItem {
  problem: string
  userAnswer: number
  correctAnswer: number
  correct: boolean
  timestamp: Date
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [generatingMessage, setGeneratingMessage] = useState('')
  const [checkingMessage, setCheckingMessage] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [problemType, setProblemType] = useState<'mixed' | 'addition' | 'subtraction' | 'multiplication' | 'division'>('mixed')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showHint, setShowHint] = useState(false)
  const [hint, setHint] = useState('')
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [solution, setSolution] = useState('')
  const [isLoadingSolution, setIsLoadingSolution] = useState(false)

  const generatingMessages = [
    "🧙‍♂️ Summoning a magical math problem...",
    "🎲 Rolling the dice of mathematics...",
    "🚀 Launching math rockets into space...",
    "🎨 Painting a beautiful problem just for you...",
    "🔮 Consulting the crystal ball of numbers...",
    "🎪 The math circus is coming to town...",
    "🌟 Sprinkling some math stardust...",
    "🎯 Aiming for the perfect problem...",
    "🧩 Putting together the puzzle pieces...",
    "💫 Creating mathematical magic...",
    "🎭 Preparing a math masterpiece...",
    "🌈 Finding a problem at the end of the rainbow...",
    "🎸 Tuning up the math instruments...",
    "🏆 Crafting a champion-level challenge...",
    "🎨 Mixing the perfect math potion..."
  ]

  const checkingMessages = [
    "🤔 Hmm, let me think about this...",
    "🔍 Investigating your answer closely...",
    "🧮 Crunching the numbers...",
    "🎓 Consulting the math professors...",
    "⚡ Running lightning-fast calculations...",
    "🧪 Testing your answer in the math lab...",
    "🔬 Examining every digit carefully...",
    "🎯 Checking if you hit the bullseye...",
    "🌟 Comparing with the stars of math...",
    "🎪 The judges are reviewing your work...",
    "🏆 Evaluating your mathematical prowess...",
    "🔮 The magic 8-ball is thinking...",
    "🎨 Painting the results...",
    "🚀 Launching answer verification sequence...",
    "💭 Deep in mathematical thought..."
  ]

  const generateProblem = async () => {
    setIsGenerating(true)
    setFeedback('')
    setUserAnswer('')
    setIsCorrect(null)
    setProblem(null)
    setShowHint(false)
    setHint('')
    setShowSolution(false)
    setSolution('')
    
    const randomMessage = generatingMessages[Math.floor(Math.random() * generatingMessages.length)]
    setGeneratingMessage(randomMessage)

    try {
      const res = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, problemType }),
      })

      if (!res.ok) throw new Error('Failed to generate problem')

      const data = await res.json()

      if (data.success) {
        setProblem(data.problem)
        setSessionId(data.sessionId)
      } else {
        alert('Failed to generate problem: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error generating problem:', error)
      alert('An error occurred while generating the problem. Please try again!')
    } finally {
      setIsGenerating(false)
    }
  }

  const getHint = async () => {
    if (!problem || hint) return
    
    setIsLoadingHint(true)
    try {
      const res = await fetch('/api/math-problem/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText: problem.problem_text }),
      })

      const data = await res.json()
      if (data.success) {
        setHint(data.hint)
        setShowHint(true)
      } else {
        alert('Failed to get hint: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error getting hint:', error)
      alert('Failed to get hint. Please try again!')
    } finally {
      setIsLoadingHint(false)
    }
  }

  const submitAnswer = async () => {
    if (!problem || !sessionId || !userAnswer.trim()) return

    setIsChecking(true)
    
    const randomMessage = checkingMessages[Math.floor(Math.random() * checkingMessages.length)]
    setCheckingMessage(randomMessage)

    try {
      const res = await fetch('/api/math-problem/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAnswer,
          correctAnswer: problem.final_answer,
          problemText: problem.problem_text,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit answer')

      const data = await res.json()

      if (data.success) {
        setFeedback(data.feedback)
        setIsCorrect(data.isCorrect)
        
        setScore(prev => ({
          correct: prev.correct + (data.isCorrect ? 1 : 0),
          total: prev.total + 1
        }))

        setHistory(prev => [{
          problem: problem.problem_text,
          userAnswer: parseFloat(userAnswer),
          correctAnswer: problem.final_answer,
          correct: data.isCorrect,
          timestamp: new Date()
        }, ...prev].slice(0, 10))
      } else {
        alert('Failed to submit answer: ' + (data.error || 'Unknown Error'))
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('An error occurred while submitting the problem. Please try again!')
    } finally {
      setIsChecking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim() && !isChecking) {
      submitAnswer()
    }
  }

  const toggleSolution = async () => {
    if (showSolution) {
      setShowSolution(false)
      return
    }

    if (solution) {
      setShowSolution(true)
      return
    }

    setIsLoadingSolution(true)
    try {
      const res = await fetch('/api/math-problem/solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: problem?.problem_text,
          correctAnswer: problem?.final_answer,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSolution(data.solution)
        setShowSolution(true)
      }
    } catch (error) {
      console.error('Error getting solution:', error)
      alert('Failed to load solution')
    } finally {
      setIsLoadingSolution(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-300">
        <header className="bg-gradient-to-r from-purple-600 to-pink-600 py-6 px-6">
          <h1 className="text-center text-3xl font-extrabold text-white select-none">
            Math Problem Generator
          </h1>
          <div className="mt-3 flex justify-center gap-4 text-white text-sm">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Score: {score.correct}/{score.total}
            </span>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-white bg-opacity-20 px-3 py-1 rounded-full hover:bg-opacity-30 transition"
            >
              {showHistory ? '📊 Hide' : '📚 History'}
            </button>
          </div>
        </header>

        <main className="p-6">
          {showHistory ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Problems</h2>
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No problems solved yet!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${
                        item.correct
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <p className="text-sm text-gray-700 mb-2">{item.problem}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold">
                          Your answer: {item.userAnswer}
                        </span>
                        <span className={item.correct ? 'text-green-600' : 'text-red-600'}>
                          {item.correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      {!item.correct && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-semibold">Correct answer: {item.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition mt-4"
              >
                Back to Problems
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        disabled={isGenerating || isChecking || isLoadingHint || isLoadingSolution}
                        className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
                          difficulty === level
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Problem Type
                  </label>
                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value as any)}
                    disabled={isGenerating || isChecking || isLoadingHint || isLoadingSolution}
                    className="w-full py-2 px-3 rounded-lg border-2 border-gray-300 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                  >
                    <option value="mixed">Mixed Problems</option>
                    <option value="addition">Addition</option>
                    <option value="subtraction">Subtraction</option>
                    <option value="multiplication">Multiplication</option>
                    <option value="division">Division</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={generateProblem}
                  disabled={isGenerating || isChecking || isLoadingHint || isLoadingSolution}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating Magic...' : '✨ Generate New Problem'}
                </button>
              </div>

              {problem && (
                <section className="rounded-2xl p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Problem</h2>
                    {problem.difficulty && (
                      <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {problem.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="mb-6 text-gray-800 text-lg">{problem.problem_text}</p>

                  {!feedback ? (
                    <div className="space-y-4">
                      {!isChecking ? (
                        <>
                          <label htmlFor="answer" className="block font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <span className="text-2xl">💡</span> Your Answer:
                          </label>
                          <input
                            type="number"
                            id="answer"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyPress={handleKeyPress}
                            step="any"
                            placeholder="Enter your answer..."
                            disabled={isChecking || isLoadingHint}
                            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          
                          <div className="flex gap-2">
                            <button
                              onClick={getHint}
                              disabled={showHint || !problem || isLoadingHint || isLoadingSolution}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
                            >
                              {isLoadingHint ? '⏳ Loading...' : showHint ? '💡 Hint Shown' : '💡 Get Hint'}
                            </button>
                            <button
                              onClick={submitAnswer}
                              disabled={!userAnswer || isChecking || isLoadingHint || isLoadingSolution}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-black py-3 rounded-lg shadow-md transition"
                            >
                              {isChecking ? 'Checking...' : '🚀 Submit'}
                            </button>
                          </div>

                          {showHint && hint && (
                            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                              <p className="text-sm font-semibold text-yellow-800 mb-1">💡 Hint:</p>
                              <p className="text-sm text-yellow-900">{hint}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-blue-600 select-none">
                          <div className="text-6xl mb-4 animate-pulse">🤔</div>
                          <p className="text-lg font-bold">{checkingMessage}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`p-6 rounded-xl border-4 ${
                        isCorrect
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                      }`}
                    >
                      <div className="flex justify-center mb-4 text-6xl">
                        {isCorrect ? '🎉' : '🤔'}
                      </div>
                      <h3 className="text-2xl font-extrabold text-center mb-3">
                        {isCorrect ? 'Absolutely Correct!' : 'Not Quite Right'}
                      </h3>
                      <p className="text-center text-lg mb-4">{feedback}</p>
                      
                      {!isCorrect && (
                        <button
                          onClick={toggleSolution}
                          disabled={isLoadingSolution}
                          className="w-full mb-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg transition"
                        >
                          {isLoadingSolution
                            ? '⏳ Loading Solution...'
                            : showSolution
                            ? '🔒 Hide Solution'
                            : '🔓 Show Step-by-Step Solution'}
                        </button>
                      )}

                      {showSolution && !isCorrect && solution && (
                        <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-300">
                          <p className="text-sm font-semibold text-blue-800 mb-3">📝 Step-by-Step Solution:</p>
                          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                            {solution}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={generateProblem}
                        disabled={isLoadingSolution}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition disabled:cursor-not-allowed"
                      >
                        🎯 Try Another Problem
                      </button>
                    </div>
                  )}
                </section>
              )}

              {!problem && !isGenerating && (
                <div className="text-center py-16 text-gray-600 select-none">
                  <div className="text-8xl mb-6 animate-bounce">🎯</div>
                  <p className="text-xl font-semibold">Click the button above to start your math journey!</p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-16 text-purple-600 select-none">
                  <div className="text-8xl mb-6 animate-spin">✨</div>
                  <p className="text-xl font-bold">{generatingMessage}</p>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="bg-gray-100 py-4 text-center text-gray-600 text-sm select-none border-t border-gray-200">
          Powered by AI ✨
        </footer>
      </div>
    </div>
  )
}