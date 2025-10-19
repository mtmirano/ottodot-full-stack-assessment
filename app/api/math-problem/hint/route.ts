import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { problemText } = await request.json();
    
    if (!problemText) {
      return NextResponse.json(
        { success: false, error: 'Problem text required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    const hintPrompt = `You are a helpful Primary 5 math tutor. A student is stuck on this problem:

"${problemText}"

Give them a helpful hint that guides them toward the solution WITHOUT revealing the answer. Your hint should:
- Help them understand what approach to take
- Break down the problem into steps
- Use encouraging language
- Be 1-2 sentences maximum
- NOT give away the final answer

Return ONLY the hint text, no formatting.`;

    const result = await model.generateContent(hintPrompt);
    const response = await result.response;
    const hintText = response.text().trim();

    return NextResponse.json({
      success: true,
      hint: hintText,
    });

  } catch (error) {
    console.error('Error generating hint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate hint' },
      { status: 500 }
    );
  }
}