const express = require("express");
const path = require("path");
const con = require("./config/db");
const bcrypt = require("bcrypt");
const session = require('express-session');

const MemoryStore = require('memorystore')(session);

const app = express();

app.use(session({
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, //1 day in millisec
    secret: 'mysecretcode',
    resave: false,
    saveUninitialized: true,
    // config MemoryStore here
    store: new MemoryStore({
        checkPeriod: 24 * 60 * 60 * 1000 // prune expired entries every 24h
    })
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/Allbook", function (_req, res) {
    const sql = "SELECT * FROM book";
    con.query(sql, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
})

app.post('/login', function (req, res) {
    const { borrower_id, password } = req.body;
    const sql = "SELECT borrower_id, password, roleuser FROM borrower WHERE borrower_id = ?";

    // If its on input all Username and Password
    if (!borrower_id || !password) {
        return res.status(400).send("Please provide both username and password");
    }

    con.query(sql, [borrower_id], function (err, results) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Database server error");
        }
        if (results.length !== 1) {
            console.log("User not found or multiple users found:", results);
            return res.status(401).send("Wrong username or password");
        }

        bcrypt.compare(password, results[0].password, function (err, passwordMatch) {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).send("Error comparing passwords");
            }

            if (!passwordMatch) {
                return res.status(401).send("Wrong username or password");
            }
            const roleuser = results[0].roleuser
            if(roleuser == 1 ){
                res.send("/HomeAdmin");
            }else if (roleuser == 2){
                res.send("/HomeStaff");
            }else if (roleuser == 3){
                res.send("/Home");
            }
            
        });
    });

    
});

app.get('/dashboard', function(req, res) {
    const sql = `
      SELECT
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_books,
        SUM(CASE WHEN status = 'Borrowed' THEN 1 ELSE 0 END) AS borrowed_books,
        SUM(CASE WHEN status = 'Disable' THEN 1 ELSE 0 END) AS disabled_books,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_books
      FROM 
        book;
    `;
    con.query(sql, function (err, results) {
      if (err) {
        console.error(err);
        return res.status(500).send("Database server error");
      }
      const { available_books, borrowed_books, disabled_books, pending_books } = results[0];
      res.json({
        available_books,
        borrowed_books,
        disabled_books,
        pending_books
      });
    });
  });
  

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "View/index.html"));
});
app.get("/Home", function (req, res) {
    res.sendFile(path.join(__dirname, "View/User/home.html"));
});
app.get("/HomeStaff", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Staff/Dashboard.html"));
});
app.get("/Home/History", function (req, res) {
    res.sendFile(path.join(__dirname, "View/User/History.html"));
});
app.get("/HomeAdmin/History", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Admin/HistoryAD.html"));
});
app.get("/HomeAdmin", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Admin/DashboardAD.html"));
});
app.get("/HomeStaff/History", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Staff/HistoryST.html"));
});
app.get("/HomeAdmin/Status", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Admin/statusAD.html"));
});
app.get("/HomeStaff/Return", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Staff/ReturnST.html"));
});
app.get("/HomeStaff/List", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Staff/ListST.html"));
});
app.get("/Home/Status", function (req, res) {
    res.sendFile(path.join(__dirname, "View/User/status.html"));
});
app.get("/Home/List", function (req, res) {
    res.sendFile(path.join(__dirname, "View/User/List.html"));
});
app.get("/Register", function (req, res) {
    res.sendFile(path.join(__dirname, "View/Register.html"));
});
app.post("/Home/List",async function (req, res){
     
});
app.post("/Register", async function (req, res) {
    const studentID = req.body.studentID;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const reenterPassword = req.body.reenterPassword; // Capture re-entered password

    if (!studentID || !name || !email || !password || !reenterPassword) {
        return res.status(401).redirect('/Register?registerError=true');
    }

    // Check if password and reentered password match
    if (password !== reenterPassword) {
        return res.status(401).redirect('/Register?passwordMismatch=true');
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO borrower (borrower_id, name, password, Email, roleuser) VALUES (?, ?, ?, ?, ?)";
        const values = [studentID, name, hashedPassword, email, 3]; // Include hashedPassword

        con.query(sql, values, function (err, result) {
            if (err) {
                return res.status(500).send("Database server error: " + err.message); // Include specific error message
            }
            // Redirect with registerSuccess=true parameter
            res.status(201).redirect('/Register?registerSuccess=true');
        });
    } catch (error) {
        return res.status(500).send("Error hashing password");
    }
});
app.get("/logout", function (req, res) {
    // Destroy the session to clear user data
    req.session.destroy(function (err) {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal server error");
        }
        // Redirect to the login page or any other page
        res.redirect("/login"); // Replace "/login" with the actual login page route
    });
});

// Start server at the specified port, if there is an error, try another port number
const port = 3000;
app.listen(port, function () {
    console.log("Server is ready at " + port);
});