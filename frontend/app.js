function testAPI() {
    fetch("https://mountain-mate-api.onrender.com/api/health")
        .then(res => res.json())
        .then(data => {
            document.getElementById("result").innerText = data.message;
        })
        .catch(() => {
            document.getElementById("result").innerText = "Backend not reachable";
        });
}
