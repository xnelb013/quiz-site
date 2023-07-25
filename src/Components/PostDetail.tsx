import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { app, db, storage } from "../../firebase";
import { Timestamp } from "firebase/firestore";
import styled from "styled-components";
import React from "react";
import { auth } from "../../firebase.ts";
import { Comment } from "../../Comment.ts";
import Modal from "./Modal";
import CommentsList from "./CommentsList.tsx";
import parse from "html-react-parser";

interface Post {
  id: string;
  title: string;
  content: string;
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  userPhotoURL: string;
  imageURL: string;
}

const ParentContainer = styled.div`
  display: flex;
  justify-content: start;
  align-itmes: start;
`;

const Header = styled.div`
  width: 1080px;
  height: 200px;
  text-align: start;
  border-bottom: 1px solid #ccc;
  border-top: 2px solid #60a5fa;
  padding: 30px 20px;
`;

const Container = styled.div`
  margin: 100px auto;
  width: 1080px;
`;

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [answer, setAnswer] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [profileImgURL, setProfileImgURL] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentUser = auth.currentUser; // AuthContext에서 현재 사용자 가져오기

  //정답 칸의 변화 -> answer state 저장
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => setAnswer(event.target.value);

  const navigate = useNavigate();

  // storage에 uid로 저장되어 있는 이미지 불러오기
  useEffect(() => {
    if (post) {
      const getImageURL = async () => {
        const path = `images/${post.uid}`;
        const url = await storage.ref(path).getDownloadURL();
        setProfileImgURL(url);
      };
      getImageURL();
    }
  }, [post]);

  // firebase post 정보가져오기
  const fetchPost = async () => {
    const querySnapshot = await db.collection("posts").where("postId", "==", postId).get();
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      if (data) {
        // Get user name from Firestore
        let displayName = "Unknown";
        const userDoc = await db.collection("users").doc(data.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData && userData.name) {
            displayName = userData.name;
          }
        }

        setPost({
          id: doc.id,
          ...data,
          displayName: displayName,
        } as Post);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditClick = (postId: any) => {
    navigate(`/postEditor/${postId}`);
  };

  const answerSubmit = async () => {
    const doc = await db.collection("posts").doc(postId).get();
    if (doc.exists) {
      const data = doc.data();

      const user = app.auth().currentUser;
      // 미 로그인 시
      if (!user) {
        console.log("User not found");
        return;
      }

      // 자신의 문제에 정답을 입력했을 시
      if (data && data.uid === user.uid) {
        alert("자신의 문제는 풀 수 없습니다.");
        return;
      }

      // 정답일 시
      if (data && data.answer === answer) {
        alert("정답입니다!");

        // 현재 로그인된 사용자 가져오기
        const user = app.auth().currentUser;
        if (!user) {
          console.log("User not found");
          return;
        }

        // 사용자의 rankPoint 가져오기
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
          console.log("User not found");
          return;
        }
        const userData = userDoc.data();
        if (!userData) {
          console.log("User data not found");
          return;
        }
        const rankPoint = userData.rankPoint || 0;

        // 이미 푼 문제인지 확인
        const solvedPosts = userData.solvedPosts || [];
        if (solvedPosts.includes(postId)) {
          alert("이미 푼 문제입니다! 점수가 오르지 않습니다!");
          return;
        }

        // 사용자의 rankPoint 업데이트
        await db
          .collection("users")
          .doc(user.uid)
          .update({
            rankPoint: rankPoint + 10,
            solvedPosts: [...solvedPosts, postId],
          });
      } else {
        alert("틀렸습니다!");
      }
    }
  };

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // 게시글 삭제 시
  const handleModalConfirm = async () => {
    // db 삭제
    await db.collection("posts").doc(postId).delete();

    // Storage에서 이미지 파일 삭제
    const storageRef = app.storage().ref();
    const imageRef = storageRef.child(`posts/${postId}`);
    imageRef
      .getDownloadURL()
      .then(async () => {
        await imageRef.delete();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((error: any) => {
        console.error("Error deleting image file:", error);
      });

    // 홈으로 이동
    navigate("/");
  };

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (currentUser) {
      try {
        // users 컬렉션에서 현재 로그인한 사용자의 정보 가져오기
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        const userData = userDoc.data();

        // Firebase Storage에서 이미지 URL 가져오기
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`images/${currentUser.uid}`);
        const userPhotoURL = await imageRef.getDownloadURL();

        const newComment = {
          postId: postId ?? "",
          uid: currentUser.uid,
          name: userData?.name ?? "", // users 컬렉션에서 가져온 사용자 이름 사용
          createdAt: Timestamp.now(),
          content: comment,
          userPhotoURL,
        };
        // db 저장
        await db.collection("comments").add(newComment);
        setComment("");
      } catch (error) {
        alert("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } else {
      alert("로그인을 해주세요.");
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      const querySnapshot = await db.collection("comments").where("postId", "==", postId).get();
      const commentsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as Comment));
      setComments(commentsData);
    };

    // fetchComments 함수를 호출하는 부분을 수정
    const unsubscribe = db.collection("comments").onSnapshot(fetchComments);

    // 컴포넌트가 언마운트될 때 구독 취소
    return () => unsubscribe();
  }, [postId]);

  const sortedComments = [...comments].sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!post) return null;

  return (
    <div>
      <ParentContainer>
        <Container>
          <div className="text-left">
            <Link to="/quizPage">
              <button className="text-left text-4xl mb-5 font-bold text-blue-400 pl-4">멘사 퀴즈</button>
            </Link>
          </div>
          <div className="flex flex-col space-y-10 overflow-hidden rounded-lg shadow-md dark:bg-gray-900 dark:text-gray-100">
            <Header>
              <h2 className="mb-8 text-3xl font-semibold">{post.title}</h2>
              <div className="flex space-x-6">
                <img
                  alt=""
                  src={profileImgURL}
                  className="object-cover w-16 h-16 rounded-full shadow dark:bg-gray-500"
                />
                <div className="flex flex-col space-y-1">
                  <Link to={`/profile/${post.uid}`} className="text-lg font-semibold text-left">
                    {post.displayName}
                  </Link>
                  <span className="text-lg dark:text-gray-400 text-left">
                    {post.createdAt.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Header>
            <div>
              {Array.isArray(post.imageURL) && (
                <div>
                  <div>
                    {/* post.imageURL 배열을 map으로 순회하여 모든 이미지를 출력 */}
                    {post.imageURL.map((url, index) => (
                      <img
                        key={index}
                        src={url ? url : "/noImage.png"}
                        alt={`Image ${index + 1}`}
                        className="object-cover w-3xl mb-4 dark:bg-gray-500"
                      />
                    ))}{" "}
                  </div>
                </div>
              )}
              <p className="text-md dark:text-gray-400 mt-10 mb-20 text-left p-10">{parse(post.content)}</p>
            </div>
            <div className="relative">
              <div className="flex justify-center">
                <input
                  type="search"
                  id="default-search"
                  className="block w-72 p-4 pl-10 text-md text-gray-900 border border-gray-300 rounded-l-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="정답을 입력해주세요."
                  onChange={onChange}
                  value={answer}
                  required
                />
                <button
                  type="submit"
                  onClick={answerSubmit}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-r-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  제출
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-end">
              <Modal isOpen={isModalOpen} onClose={handleModalClose} onConfirm={handleModalConfirm} />
              {post && currentUser && post.uid === currentUser.uid && (
                <div className="space-x-2 mb-10 mr-10">
                  <button
                    aria-label="Share this post"
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleEditClick(postId)}
                  >
                    수정
                  </button>
                  <button
                    aria-label="Bookmark this post"
                    type="button"
                    className="btn btn-outline btn-secondary"
                    onClick={() => handleDeleteClick()}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </ParentContainer>
      <CommentsList comments={sortedComments} currentUid={currentUser ? currentUser.uid : null} />{" "}
      <div className="flex items-center w-[1150px] mx-auto bg-white rounded-lg border p-1 p-3 m-10 ">
        <div className="flex-1 px-3 mb-2 mt-3.5">
          <textarea
            className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-24 py-2 px-3 font-medium placeholder-gray-400 focus:outline-none focus:bg-white"
            name="body"
            placeholder="Comment"
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            required
          ></textarea>
        </div>
        <div className="flex-9 flex justify-center px-3 my-3 h-20">
          <button
            className="px-2.5 py-1.5 rounded-md text-white text-sm bg-indigo-500 text-lg h-30"
            onClick={handleCommentSubmit}
          >
            댓글 작성
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
