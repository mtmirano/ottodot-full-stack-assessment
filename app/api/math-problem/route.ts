// app/api/math-problem/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../../lib/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `Generate a math word problem suitable for a Primary 5 student (Singapore curriculum, age 10-11).

The problem should:
- Be age-appropriate and engaging
- Involve real-world scenarios (shopping, sports, time, measurement, fractions, decimals, etc.)
- Have a clear numerical answer
- Be challenging but solvable with Primary 5 math concepts

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "problem_text": "The complete word problem as a string",
  "final_answer": the numerical answer as a number (not a string)
}

Example:
{
  "problem_text": "Sarah has $45.50. She wants to buy 3 books that cost $12.80 each. How much money will she have left?",
  "final_answer": 7.1
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let problemData;
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      problemData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { success: false, error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    if (!problemData.problem_text || typeof problemData.final_answer !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid problem structure' },
        { status: 500 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Supabase error:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Database error: ' + sessionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      problem: {
        problem_text: problemData.problem_text,
        final_answer: problemData.final_answer,
      },
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Error generating problem:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate problem' },
      { status: 500 }
    );
  }
}
