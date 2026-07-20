from flask import Flask, render_template, request, session, redirect, url_for

app = Flask(__name__)
app.secret_key = '644466'  # Change this to a random secret key
users = {
    "admin": {
        "password": "123456",
        "role": "admin"
    },

    "minh": {
        "password": "1",
        "role": "buyer"
    },

    "seller01": {
        "password": "22",
        "role": "seller"
    }
}

@app.route("/")
def home():
    return render_template("index.html", username=session.get('username'))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    elif request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if username in users and users[username]["password"] == password:
            session['username'] = username
            session['role'] = users[username]["role"]
            return redirect(url_for("home"))
        else:
            return render_template("login.html", error="Invalid username or password")
        
@app.route("/upload", methods=["GET", "POST"])
def upload():
    if 'username' not in session:
        return redirect(url_for("login"))
    if request.method == "GET":
        return render_template("upload.html")
    elif request.method == "POST":
        # Handle file upload logic here
        return "File uploaded successfully"
    
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)