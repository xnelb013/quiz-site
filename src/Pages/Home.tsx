import PostList from "../Components/PostList";

import { Carousel } from "../Components/Carousel";

const Home = () => {
  return (
    <>
      <Carousel />
      <div className="max-w-[1280px] mx-auto">
        <PostList />
      </div>
    </>
  );
};

export default Home;
