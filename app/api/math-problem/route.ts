import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../../lib/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { difficulty = 'medium', problemType = 'mixed' } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const difficultyGuide = {
      easy: `
        - Use simple whole numbers (1-100)
        - Single-step problems
        - Basic operations (addition, subtraction, simple multiplication)
        - No fractions or decimals
        - Straightforward wording`,
      medium: `
        - Use numbers up to 1000
        - Two-step problems
        - Include decimals (up to 2 decimal places) or simple fractions
        - Mix of operations
        - Moderate problem complexity`,
      hard: `
        - Use larger numbers (up to 10,000)
        - Multi-step problems (3+ steps)
        - Complex fractions, decimals, percentages
        - Multiple operations and concepts combined
        - Requires careful planning and reasoning`
    };

    const problemTypeGuide = {
      mixed: 'Use any combination of addition, subtraction, multiplication, and division',
      addition: 'Focus on addition problems (may include multiple numbers to add)',
      subtraction: 'Focus on subtraction problems (may include borrowing/regrouping)',
      multiplication: 'Focus on multiplication problems (single or multi-digit)',
      division: 'Focus on division problems (with or without remainders)'
    };

    const prompt = `Generate a math word problem suitable for a Primary 5 student (Singapore curriculum, age 10-11).

    DIFFICULTY: ${difficulty.toUpperCase()}
    ${difficultyGuide[difficulty as keyof typeof difficultyGuide]}

    PROBLEM TYPE: ${problemType.toUpperCase()}
    ${problemTypeGuide[problemType as keyof typeof problemTypeGuide]}

    The problem should:
    - Be age-appropriate and engaging
    - Involve real-world scenarios (shopping, sports, time, measurement, etc.)
    - Have a clear numerical answer
    - Match the specified difficulty level exactly
    - Use the specified problem type

    Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
    {
      "problem_text": "The complete word problem as a string",
      "final_answer": the numerical answer as a number (not a string),
      "difficulty": "${difficulty}",
      "problem_type": "${problemType}"
    }

    Example for EASY Addition:
    {
      "problem_text": "Tom has 25 marbles. His friend gives him 18 more marbles. How many marbles does Tom have now?",
      "final_answer": 43,
      "difficulty": "easy",
      "problem_type": "addition"
    }

    Example for MEDIUM Mixed:
    {
      "problem_text": "Sarah has $45.50. She wants to buy 3 books that cost $12.80 each. How much money will she have left?",
      "final_answer": 7.1,
      "difficulty": "medium",
      "problem_type": "mixed"
    }

    Example for HARD Division:
    {
      "problem_text": "A bakery made 2,456 cookies. They want to pack them equally into boxes of 24 cookies each. How many full boxes can they make, and how many cookies will be left over? Give your answer as the number of full boxes plus the decimal remainder.",
      "final_answer": 102.33,
      "difficulty": "hard",
      "problem_type": "division"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
