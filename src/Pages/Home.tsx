import { Link, useNavigate } from "react-router-dom";
import PostList from "../Components/PostList";
import { auth } from "../../firebase"; // firebase 모듈에서 auth 객체를 가져옵니다.
import { Carousel } from "../Components/Carousel";

const Home = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!auth.currentUser) {
      alert("로그인을 해주세요");
    } else {
      navigate("/postEditor");
    }
  };

  return (
    <>
      <Carousel />
      <div className="max-w-[1280px] mx-auto">
        <button className="mt-7 text-3xl" onClick={handleClick}>
          글쓰기
        </button>
        <PostList />
      </div>
    </>
  );
};

export default Home;
