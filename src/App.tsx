import "./App.css";
import Navibar from "./Components/Navibar";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Signup from "./Pages/Signup";
import ProfilePage from "./Pages/ProfilePage";
import Home from "./Pages/Home";
import PostEditor from "./Components/PostEditor";
import PostDetail from "./Components/PostDetail";
import RankListPage from "./Pages/RankListPage";
import ProfileEdit from "./Pages/profileEditPage";
import QuizPage from "./Pages/QuizPage";
import Footer from "./Components/Footer";

// const firebase = getFirestore(app);

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-[1280px] mx-auto">
        <Navibar />
      </div>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/posteditor/:urlId" element={<PostEditor />} />
          <Route path="/posteditor" element={<PostEditor />} />
          <Route path="/quizPage" element={<QuizPage />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/rankList" element={<RankListPage />} />
          <Route path="/profileEdit/:uid" element={<ProfileEdit />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
