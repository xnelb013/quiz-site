import React, { useEffect, useState } from "react";
import firebase from "firebase/app";
import { Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Pagination from "./Pagination";

const StyledList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  margin: 0 auto;
  padding: 0;
`;

const StyledListItem = styled.li`
  margin: 20px;
  width: 250px;
  margin-right: 34px;
`;

interface Post {
  id: string;
  title: string;
  content: string;
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  photoURL: string;
  imageURL: string;
  postId: string;
}

const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(8);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post));
    setPosts(posts);
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const handlePostClick = (post: Post) => {
    navigate(`/posts/${post.postId}`);
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  return (
    <>
      <section className="py-6 sm:py-12 dark:bg-gray-800 dark:text-gray-100">
        <div className="container p-6 mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold">멘사 퀴즈</h2>
            <p className="font-serif text-sm dark:text-gray-400">당신의 두뇌를 시험해보세요.</p>
          </div>
        </div>
      </section>
      <div className="mx-auto w-[1280px]">
        <StyledList>
          {currentPosts.map((post) => (
            <StyledListItem key={post.id} onClick={() => handlePostClick(post)}>
              <article className="flex flex-col dark:bg-gray-900">
                <a rel="noopener noreferrer" href="#" aria-label="Te nulla oportere reprimique his dolorum">
                  <img
                    alt=""
                    className="object-cover w-full h-52 dark:bg-gray-500"
                    src={post.imageURL && post.imageURL.length > 0 ? post.imageURL : "/noImage.png"}
                  />
                </a>
                <div className="flex flex-col flex-1 p-6">
                  <a rel="noopener noreferrer" href="#" aria-label="Te nulla oportere reprimique his dolorum"></a>
                  <a
                    rel="noopener noreferrer"
                    href="#"
                    className="text-xs tracki uppercase hover:underline dark:text-violet-400"
                  >
                    {post.displayName}
                  </a>
                  <h3 className="flex-1 py-2 text-lg font-semibold leadi">{post.title}</h3>
                  <div className="flex flex-wrap justify-between pt-3 space-x-2 text-xs dark:text-gray-400">
                    <span>{post.createdAt.toDate().toLocaleDateString()}</span>
                    <span>2.1K views</span>
                  </div>
                </div>
              </article>
            </StyledListItem>
          ))}
        </StyledList>
      </div>
      <Pagination
        totalPosts={posts.length}
        postsPerPage={postsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default PostList;
