// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import PostList from "./components/PostList";
import PostEditor from "./components/PostEditor";

function App() {
  const navigate = useNavigate();

  const handleSelectPost = (post) => {
    navigate(`/edit/${post.id}`);
  };

  return (
    <Routes>
      <Route path="/" element={<PostList onSelectPost={handleSelectPost} />} />
      <Route path="/new" element={<PostEditor />} />
      <Route path="/edit/:id" element={<PostEditor />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
