const API = "https://mountain-mate-api.onrender.com";

async function testAPI() {
  try {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();

    document.getElementById("result").innerText =
      "Backend Connected ✅\n" + data.message;

  } catch (err) {
    document.getElementById("result").innerText =
      "Connection Failed ❌";
  }
}
