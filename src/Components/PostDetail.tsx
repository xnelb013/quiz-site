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
  photoURL: string;
  imageURL: string;
}

const Container = styled.div`
  margin: 100px auto;
  width: 1000px;
  heigth: 1000px;
`;

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [answer, setAnswer] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  const currentUser = auth.currentUser; // AuthContext에서 현재 사용자 가져오기

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => setAnswer(event.target.value);
  const navigate = useNavigate();
  function extractTextFromHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  console.log(postId);

  const handleEditClick = (postId: any) => {
    navigate(`/postEditor/${postId}`);
  };

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
        const photoURL = await imageRef.getDownloadURL();

        const newComment = {
          postId: postId ?? "",
          uid: currentUser.uid,
          name: userData?.name ?? "", // users 컬렉션에서 가져온 사용자 이름 사용
          createdAt: Timestamp.now(),
          content: comment,
          photoURL, // Firebase Storage에서 가져온 이미지 URL 사용
        };
        const docRef = await db.collection("comments").add(newComment);
        setComments((comments) => [...comments, { ...newComment, id: docRef.id }]);
        setAnswer("");
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

  useEffect(() => {
    fetchPost();
  }, []);

  if (!post) return null;

  return (
    <div>
      <Container>
        <article className="flex flex-col dark:bg-gray-900">
          <a rel="noopener noreferrer" href="#" aria-label="Te nulla oportere reprimique his dolorum">
            <img alt="" className="object-cover w-full h-130 dark:bg-gray-500" src={post.imageURL} />
          </a>
          <div className="flex flex-col flex-1 p-6">
            <a rel="noopener noreferrer" href="#" aria-label="Te nulla oportere reprimique his dolorum"></a>
            <a
              rel="noopener noreferrer"
              href="#"
              className="text-xs tracki uppercase hover:underline dark:text-violet-400"
            >
              {extractTextFromHtml(post.content)}
            </a>
            <h3 className="flex-1 py-2 text-lg font-semibold leadi">{post.title}</h3>
            <div className="flex flex-wrap justify-between pt-3 space-x-2 text-xs dark:text-gray-400">
              <span>{post.createdAt.toDate().toLocaleDateString()}</span>
              <span>2.1K views</span>
            </div>
          </div>
        </article>
      </Container>
      <Container>
        <div className="flex flex-col max-w-lg p-6 space-y-6 overflow-hidden rounded-lg shadow-md dark:bg-gray-900 dark:text-gray-100">
          <div className="flex space-x-4">
            <img alt="" src={post.photoURL} className="object-cover w-12 h-12 rounded-full shadow dark:bg-gray-500" />
            <div className="flex flex-col space-y-1">
              <a rel="noopener noreferrer" href="#" className="text-sm font-semibold">
                {post.displayName}
              </a>
              <span className="text-xs dark:text-gray-400">{post.createdAt.toDate().toLocaleDateString()}</span>
            </div>
          </div>
          <div>
            <img src={post.imageURL} alt="asdasd" className="object-cover w-full mb-4 h-60 sm:h-96 dark:bg-gray-500" />
            <h2 className="mb-1 text-xl font-semibold">{post.title}</h2>
            <p className="text-sm dark:text-gray-400">{extractTextFromHtml(post.content)}</p>
          </div>
          <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"></div>
            <input
              type="search"
              id="default-search"
              className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="정답을 입력해주세요."
              onChange={onChange}
              value={answer}
              required
            />
            <button
              type="submit"
              onClick={answerSubmit}
              className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              제출
            </button>
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
              <button type="button" className="flex items-center p-1 space-x-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  aria-label="Number of comments"
                  className="w-4 h-4 fill-current dark:text-violet-400"
                >
                  <path d="M448.205,392.507c30.519-27.2,47.8-63.455,47.8-101.078,0-39.984-18.718-77.378-52.707-105.3C410.218,158.963,366.432,144,320,144s-90.218,14.963-123.293,42.131C162.718,214.051,144,251.445,144,291.429s18.718,77.378,52.707,105.3c33.075,27.168,76.861,42.13,123.293,42.13,6.187,0,12.412-.273,18.585-.816l10.546,9.141A199.849,199.849,0,0,0,480,496h16V461.943l-4.686-4.685A199.17,199.17,0,0,1,448.205,392.507ZM370.089,423l-21.161-18.341-7.056.865A180.275,180.275,0,0,1,320,406.857c-79.4,0-144-51.781-144-115.428S240.6,176,320,176s144,51.781,144,115.429c0,31.71-15.82,61.314-44.546,83.358l-9.215,7.071,4.252,12.035a231.287,231.287,0,0,0,37.882,67.817A167.839,167.839,0,0,1,370.089,423Z"></path>
                  <path d="M60.185,317.476a220.491,220.491,0,0,0,34.808-63.023l4.22-11.975-9.207-7.066C62.918,214.626,48,186.728,48,156.857,48,96.833,109.009,48,184,48c55.168,0,102.767,26.43,124.077,64.3,3.957-.192,7.931-.3,11.923-.3q12.027,0,23.834,1.167c-8.235-21.335-22.537-40.811-42.2-56.961C270.072,30.279,228.3,16,184,16S97.928,30.279,66.364,56.206C33.886,82.885,16,118.63,16,156.857c0,35.8,16.352,70.295,45.25,96.243a188.4,188.4,0,0,1-40.563,60.729L16,318.515V352H32a190.643,190.643,0,0,0,85.231-20.125,157.3,157.3,0,0,1-5.071-33.645A158.729,158.729,0,0,1,60.185,317.476Z"></path>
                </svg>
                <span>30</span>
              </button>
              <button type="button" className="flex items-center p-1 space-x-1.5">
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
      {currentUser && <CommentsList comments={comments} currentUid={currentUser.uid} />}{" "}
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
