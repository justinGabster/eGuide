import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // For the hackathon demo, we will mock the response so you don't need real partner secrets.
    // This guarantees your demo will work flawlessly without relying on live external APIs.
    if (!body.exchange_code) {
      return NextResponse.json({ error: "Missing exchange_code" }, { status: 400 });
    }

    return NextResponse.json({
      access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3N0Zy1zdXBlcmFwcC1zc28ub3VlZy5pbmZvIiwiaWF0IjoxNzgzMzk3NDEyLjEwNDY0LCJzY29wZSI6IlNTT19BVVRIRU5USUNBVElPTiIsInBjIjoiVEVTVF9BR0VOQ1kiLCJ0a2kiOjY4LCJqdGkiOiJNVlBDQkVVVkNHUFpSIiwiZXhwIjoxNzgzNDAxMDEyfQ._zr4dq-hwNpVctc-Vm6j5cyVn98W0FOQS3fxY4UwNcE"
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
