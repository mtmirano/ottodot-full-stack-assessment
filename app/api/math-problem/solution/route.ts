import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { problemText, correctAnswer } = await request.json();
    
    if (!problemText || correctAnswer === undefined) {
      return NextResponse.json(
        { success: false, error: 'Problem text and answer required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const solutionPrompt = `You are a friendly Primary 5 math tutor helping a student understand how to solve this problem.

Problem: "${problemText}"

Provide a clear step-by-step solution that shows:
- Step 1: What information we have
- Step 2: What we need to find
- Step 3, 4, etc.: Each calculation step with explanation
- Final Answer: ${correctAnswer}

Use simple language for a 10-11 year old. Number each step clearly. Show your work with actual calculations.

Example format:
Step 1: Understanding the problem
We know that...

Step 2: First calculation
We need to find... 
Calculation: ...

Step 3: Next calculation
Now we calculate...
Calculation: ...

Final Answer: ${correctAnswer}

Return ONLY the step-by-step solution, no extra formatting or markdown.`;

    const result = await model.generateContent(solutionPrompt);
    const response = await result.response;
    const solutionText = response.text().trim();

    return NextResponse.json({
      success: true,
      solution: solutionText,
    });

  } catch (error) {
    console.error('Error generating solution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate solution' },
      { status: 500 }
    );
  }
}