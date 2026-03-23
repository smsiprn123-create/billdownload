const remoteApiBase = "https://jdvvnl.bijlimitra.com/jdvvnlmitra/accountdetailsByKno/";

export default async function handler(request, response) {
  const { kno } = request.query;

  if (!kno || !String(kno).trim()) {
    response.status(400).json({ error: "K No required." });
    return;
  }

  try {
    const upstream = await fetch(remoteApiBase + encodeURIComponent(String(kno).trim()));
    const raw = await upstream.text();

    if (!upstream.ok) {
      response.status(upstream.status).json({
        error: "Remote API returned an error.",
        details: raw.slice(0, 160)
      });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      response.status(502).json({
        error: "Remote API did not return JSON.",
        details: raw.slice(0, 160)
      });
      return;
    }

    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(payload);
  } catch {
    response.status(502).json({ error: "Failed to contact remote API." });
  }
}
