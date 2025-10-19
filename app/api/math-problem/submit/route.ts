import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../../../lib/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { sessionId, userAnswer, correctAnswer, problemText } = await request.json();
    
    if (!sessionId || userAnswer === undefined || correctAnswer === undefined || !problemText) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Parse user answer and check if correct
    const userNumericAnswer = parseFloat(userAnswer);
    
    if (isNaN(userNumericAnswer)) {
      return NextResponse.json(
        { success: false, error: 'Invalid answer format' },
        { status: 400 }
      );
    }
    
    // Check if answer is correct (with small tolerance for floating point)
    const isCorrect = Math.abs(userNumericAnswer - correctAnswer) < 0.01;
    
    // Generate personalized feedback using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const feedbackPrompt = `You are a friendly and encouraging Primary 5 math tutor. A student just attempted this problem:

Problem: ${problemText}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Is Correct: ${isCorrect}

Generate personalized feedback for the student. Your feedback should:
- Start by telling them if they're correct or incorrect
- If correct: Praise them enthusiastically and explain why their answer is right
- If incorrect: Be encouraging, explain what the correct answer is, and gently guide them through the correct approach
- Use a warm, supportive tone appropriate for a 10-11 year old
- Keep it concise (3-5 sentences)
- End with encouragement to keep practicing

Return ONLY the feedback text, no JSON, no formatting.`;

    const result = await model.generateContent(feedbackPrompt);
    const response = await result.response;
    const feedbackText = response.text().trim();
    
    // Save submission to database
    const { error: submissionError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: sessionId,
        user_answer: userNumericAnswer,
        is_correct: isCorrect,
        feedback_text: feedbackText,
      });
    
    if (submissionError) {
      console.error('Supabase submission error:', submissionError);
      return NextResponse.json(
        { success: false, error: 'Failed to save submission: ' + submissionError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      feedback: feedbackText,
      isCorrect,
    });
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}