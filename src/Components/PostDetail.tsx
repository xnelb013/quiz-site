import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { app, db, storage } from "../../firebase";
import { Timestamp } from "firebase/firestore";
import styled from "styled-components";
import React from "react";
import { auth } from "../../firebase.ts";
import { Comment } from "../../Comment.ts";
import CommentsList from "./CommentsList.tsx";
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

  const currentUser = auth.currentUser; // AuthContext에서 현재 사용자 가져오기

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => setAnswer(event.target.value);
  const navigate = useNavigate();
  function extractTextFromHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  console.log(postId);

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

  const handleEditClick = (postId: any) => {
    navigate(`/postEditor/${postId}`);
  };

  const answerSubmit = async () => {
    const doc = await db.collection("posts").doc(postId).get();
    if (doc.exists) {
      const data = doc.data();
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

  const handleDeleteClick = async (postId: any) => {
    // Delete the post document from Firestore
    await db.collection("posts").doc(postId).delete();

    // Delete the image file from Storage
    const storageRef = app.storage().ref();
    const imageRef = storageRef.child(`posts/${postId}`);
    imageRef
      .getDownloadURL()
      .then(async () => {
        await imageRef.delete();
      })
      .catch((error: any) => {
        console.error("Error deleting image file:", error);
        // 여기서 에러 처리를 할 수 있습니다.
      });

    // Navigate back to the home page
    navigate("/");
  };

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
          userPhotoURL, // Firebase Storage에서 가져온 이미지 URL 사용
        };
        const docRef = await db.collection("comments").add(newComment);
        setComments((comments) => [...comments, { ...newComment, id: docRef.id }]);
        setComment("");
        alert("댓글이 성공적으로 작성되었습니다.");
      } catch (error) {
        alert("오류가 발생했습니다. 다시 시도해주세요.");
      }
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
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, []);

  if (!post) return null;

  return (
    <div>
      <ParentContainer>
        <Container>
          <div className="text-left">
            <button className="text-left text-4xl mb-5 font-bold text-blue-400 pl-4">멘사 퀴즈</button>
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
                  <a rel="noopener noreferrer" href="#" className="text-lg font-semibold text-left">
                    {post.displayName}
                  </a>
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
              <p className="text-md dark:text-gray-400 mt-10 mb-20 text-left p-10">
                {extractTextFromHtml(post.content)}
              </p>
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

            <div className="flex flex-wrap justify-between">
              {post && currentUser && post.uid === currentUser.uid && (
                <div className="space-x-2">
                  <button
                    aria-label="Share this post"
                    type="button"
                    className="p-2 text-center"
                    onClick={() => handleEditClick(postId)}
                  >
                    수정
                  </button>
                  <button
                    aria-label="Bookmark this post"
                    type="button"
                    className="p-2"
                    onClick={() => handleDeleteClick(postId)}
                  >
                    삭제
                  </button>
                </div>
              )}
              <div className="flex space-x-2 text-sm dark:text-gray-400">
                <button type="button" className="flex items-center p-1 space-x-1.5 text-right">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    aria-label="Number of likes"
                    className="w-4 h-4 fill-current dark:text-violet-400"
                  >
                    <path d="M126.638,202.672H51.986a24.692,24.692,0,0,0-24.242,19.434,487.088,487.088,0,0,0-1.466,206.535l1.5,7.189a24.94,24.94,0,0,0,24.318,19.78h74.547a24.866,24.866,0,0,0,24.837-24.838V227.509A24.865,24.865,0,0,0,126.638,202.672ZM119.475,423.61H57.916l-.309-1.487a455.085,455.085,0,0,1,.158-187.451h61.71Z"></path>
                    <path d="M494.459,277.284l-22.09-58.906a24.315,24.315,0,0,0-22.662-15.706H332V173.137l9.573-21.2A88.117,88.117,0,0,0,296.772,35.025a24.3,24.3,0,0,0-31.767,12.1L184.693,222.937V248h23.731L290.7,67.882a56.141,56.141,0,0,1,21.711,70.885l-10.991,24.341L300,169.692v48.98l16,16H444.3L464,287.2v9.272L396.012,415.962H271.07l-86.377-50.67v37.1L256.7,444.633a24.222,24.222,0,0,0,12.25,3.329h131.6a24.246,24.246,0,0,0,21.035-12.234L492.835,310.5A24.26,24.26,0,0,0,496,298.531V285.783A24.144,24.144,0,0,0,494.459,277.284Z"></path>
                  </svg>
                  <span>283</span>
                </button>
              </div>
            </div>
          </div>
        </Container>
      </ParentContainer>
      <CommentsList comments={sortedComments} currentUid={currentUser ? currentUser.uid : null} />{" "}
      <div className="w-fullbg-white rounded-lg border p-1 md:p-3 m-10">
        <div className="w-full px-3 mb-2 mt-6">
          <textarea
            className="bg-gray-100 rounded border border-gray-400 leading-normal resize-none w-full h-20 py-2 px-3 font-medium placeholder-gray-400 focus:outline-none focus:bg-white"
            name="body"
            placeholder="Comment"
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            required
          ></textarea>
        </div>
        <div className="w-full flex justify-end px-3 my-3">
          <button
            className="px-2.5 py-1.5 rounded-md text-white text-sm bg-indigo-500 text-lg"
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
