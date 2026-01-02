// todo backend using pure node.js
const http = require("http");
const fs = require("fs");
const url = require("url");

const PORT = 3000;

// ---------- helpers ----------
function readTodos() {
  const data = fs.readFileSync("todos.json", "utf8");
  return JSON.parse(data);
}

function writeTodos(todos) {
  fs.writeFileSync("todos.json", JSON.stringify(todos, null, 2));
}

function getNextId(todos) {
  if (todos.length === 0) return 1;
  return todos[todos.length - 1].id + 1;
}

// ---------- server ----------
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json");

  // ✅ READ all todos
  if (method === "GET" && path === "/todos") {
    const todos = readTodos();
    res.end(JSON.stringify(todos));
  }

  // ✅ CREATE todo
  else if (method === "POST" && path === "/todos") {
    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const todos = readTodos();
      const data = JSON.parse(body);

      const newTodo = {
        id: getNextId(todos),
        title: data.title,
        completed: false
      };

      todos.push(newTodo);
      writeTodos(todos);

      res.end(JSON.stringify({ message: "Todo added", todo: newTodo }));
    });
  }

  // ✅ UPDATE todo (by id)
  else if (method === "PUT" && path === "/todos") {
    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const data = JSON.parse(body);
      const todos = readTodos();

      let found = false;

      const updatedTodos = todos.map(todo => {
        if (todo.id === data.id) {
          found = true;
          return {
            ...todo,
            title: data.title ?? todo.title,
            completed: data.completed ?? todo.completed
          };
        }
        return todo;
      });

      if (!found) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Todo not found" }));
      }

      writeTodos(updatedTodos);
      res.end(JSON.stringify({ message: "Todo updated" }));
    });
  }

  // ✅ DELETE todo (by id)
  else if (method === "DELETE" && path === "/todos") {
    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { id } = JSON.parse(body);
      const todos = readTodos();

      const newTodos = todos.filter(todo => todo.id !== id);

      if (todos.length === newTodos.length) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Todo not found" }));
      }

      writeTodos(newTodos);
      res.end(JSON.stringify({ message: "Todo deleted" }));
    });
  }

  // ❌ invalid route
  else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
