import "./App.css";
import Navibar from "./Components/Navibar";
import { app } from "../firebase";
import { BrowserRouter as Router, Route, BrowserRouter, Routes } from "react-router-dom";
import { getFirestore } from "firebase/firestore/lite";
import Signup from "./Pages/Signup";
import ProfilePage from "./Pages/ProfilePage";
import Home from "./Pages/Home";
import PostEditor from "./Components/PostEditor";
import PostDetail from "./Components/PostDetail";
import RankListPage from "./Pages/RankListPage";
import ProfileEdit from "./Pages/profileEditPage";

const firebase = getFirestore(app);

function App() {
  return (
    <BrowserRouter>
      <Navibar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/posteditor/:urlId" element={<PostEditor />} />
          <Route path="/posteditor" element={<PostEditor />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/rankList" element={<RankListPage />} />
          <Route path="/profileEdit/:uid" element={<ProfileEdit />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
