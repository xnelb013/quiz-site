import { Link } from "react-router-dom";
import PostList from "../Components/PostList";

const Home = () => {
  return (
    <>
      <Link to={"/postEditor"}>
        <button className="mt-7 text-3xl">글쓰기</button>
      </Link>
      <PostList />
    </>
  );
};

export default Home;
