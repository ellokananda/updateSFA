export async function GET() {
  try {
    const res = await fetch(
      "https://job.mnn.biz.id:9080/trx/export?block=DASHBOARD",
      {
        headers: {
          Authorization:
            "Bearer U2dzM1ZHa1lnTnAxWVVQS3FZMm5JR0VhVzlXMjRUeEZJZ3JobWJIM3xOQVM=",
        },
      }
    );

    const json = await res.json();

    return Response.json({
      data: Array.isArray(json?.data) ? json.data : [],
    });
  } catch (err) {
    return Response.json({
      data: [],
    });
  }
}