import { NextResponse } from "next/server";
import { runProgram, runSchema } from "@/lib/runner";
export const runtime="nodejs";
const runnerState = globalThis as unknown as { algoRunning?: number };
export async function POST(request: Request) {
  if(process.env.RUNNER_ENABLED!=="true")return NextResponse.json({error:"Execution is disabled. Build the Docker runner and set RUNNER_ENABLED=true in .env.local, then restart the app."},{status:503});
  const origin=request.headers.get("origin");
  if(origin && origin!==new URL(request.url).origin)return NextResponse.json({error:"Cross-origin execution requests are not allowed."},{status:403});
  if((runnerState.algoRunning||0)>=2)return NextResponse.json({error:"The runner is busy. Try again after the current jobs finish."},{status:429});
  let job;
  try {const text=await request.text();if(text.length>240000)return NextResponse.json({error:"Request too large."},{status:413});const parsed=runSchema.safeParse(JSON.parse(text));if(!parsed.success)return NextResponse.json({error:"Invalid run request. Check code, language, and input limits."},{status:400});job=parsed.data;}catch{return NextResponse.json({error:"Invalid JSON."},{status:400});}
  runnerState.algoRunning=(runnerState.algoRunning||0)+1;
  try{return NextResponse.json(await runProgram(job));}catch(e){return NextResponse.json({error:(e as Error).message},{status:503});}finally{runnerState.algoRunning=Math.max(0,(runnerState.algoRunning||1)-1);}
}
