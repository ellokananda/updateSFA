export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const block = searchParams.get("block");

  const token =
    "Bearer U2dzM1ZHa1lnTnAxWVVQS3FZMm5JR0VhVzlJZ3JobWJIM3xOQVM=";

  let url = "";

  // pilih endpoint berdasarkan tab
  if (block === "DASHBOARD") {
    url =
      "https://job.mnn.biz.id:9080/trx/export?block=DASHBOARD";
  }

  if (block === "IMPLEMENTATION") {
    url =
      "https://job.mnn.biz.id:9080/trx/export?block=IMPLEMENT";
  }

  if (!url) {
    return Response.json(
      { message: "Invalid block" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: token,
      },
    });

    const json = await res.json();

    // normalisasi supaya frontend aman
    return Response.json({
      data: json.data || json.result || json || [],
    });
  } catch (err: any) {
    return Response.json(
      { message: "Fetch failed", error: err.message },
      { status: 500 }
    );
  }
}