import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://job.mnn.biz.id:9080/trx/export?block=CONVSTOCK",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer U2dzM1ZHa1lnTnAxWVVQS3FZMm5JR0VhVzlXMjRUeEZJZ3JobWJIM3xOQVM=",
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    console.log("CONVSTOCK RAW:", data);

    return NextResponse.json({
      data: data?.data || [],
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        message: "Error CONVSTOCK API",
        error: err.message,
      },
      { status: 500 }
    );
  }
}