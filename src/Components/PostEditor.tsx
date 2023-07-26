import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";
import { app, db, storage } from "../../ts/firebase";
import { useNavigate, useParams } from "react-router-dom";
import firebase from "firebase/compat/app";
import { nanoid } from "nanoid";

const StyledTitle = styled.input`
  height: 50px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 10px;
`;

const StyledReactQuill = styled(ReactQuill)`
  height: 700px;
  margin-top: 0px;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  margin-top: 120px;
  gap: 20px;
`;

const StyledButton = styled.button`
  padding: 20px;
  border: 1px solid black;
  width: 100px;
  margin: 0 auto;
  margin-top: 70px;
  border-radius: 10px;
`;

interface Post {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageURL: any;
  postId: string;
  title: string;
  content: string;
  uid: string;
  displayName: string;
  answer: string;
}

// React Quill을 사용한 에디터
const PostEditor = () => {
  const [content, setContent] = useState("");
  const [userName, setUserName] = useState("");
  const [title, setTitle] = useState("");
  const [answer, setAnswer] = useState("");
  const { urlId } = useParams<{ urlId: string }>();

  const navigate = useNavigate();
  const postId = urlId || nanoid();

  // quill에 사용할 modules
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike"],
      ["image"],
      [{ align: [] }, { color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  // quill에 사용할 formats
  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "align",
    "color",
    "background",
  ];

  // 현재 로그인 유저 데이터 가져오기
  const fetchPosts = async () => {
    const user = app.auth().currentUser;
    if (!user) {
      return;
    }
    const uid = user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      console.log("User not found");
      return;
    }
    const userData = userDoc.data();
    if (!userData) {
      console.log("User data not found");
      return;
    }
    const displayName = userData.name;
    setUserName(displayName);

    if (!urlId) {
      return;
    }

    // 정보 state에 담기
    const querySnapshot = await db.collection("posts").where("postId", "==", urlId).get();
    const postsData: Post[] = querySnapshot.docs.map((doc) => ({ postId: doc.id, ...doc.data() } as Post));
    if (postsData.length > 0) {
      setTitle(postsData[0].title);
      setContent(postsData[0].content);
      setAnswer(postsData[0].answer);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (urlId) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  // submit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const user = app.auth().currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!userName) {
      await fetchPosts();
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    const images = doc.querySelectorAll("img");
    images.forEach((img) => img.remove());

    const promises = [];
    const imageURLs = [];

    for (const [index, img] of images.entries()) {
      const response = await fetch(img.src);
      const blob = await response.blob();
      const ref = storage.ref().child(`postImages/${postId}/${index}`);
      const uploadTask = ref.put(blob);
      promises.push(uploadTask);
    }

    // 이미지 업로드 지연
    await Promise.all(promises);

    // 이미들의 url담기
    for (let i = 0; i < images.length; i++) {
      const ref = storage.ref().child(`postImages/${postId}/${i}`);
      const imageURL = await ref.getDownloadURL();
      imageURLs.push(imageURL);
    }

    const newContent = doc.body.innerHTML;

    // photoURL받아오기
    const userDocRef = db.collection("users").doc(user.uid);
    const userDoc = await userDocRef.get();
    const userPhotoURL = userDoc.exists ? userDoc.data()?.photoURL : null;

    const userPhotoURLToSave = userPhotoURL || ""; // 빈 문자열을 기본값으로 사용

    // 게시글을 수정할 때
    if (urlId) {
      const querySnapshot = await db.collection("posts").where("postId", "==", urlId).get();
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const postData = doc.data() as Post;

        if (postData.imageURL) {
          for (const url of postData.imageURL) {
            const imageRef = storage.refFromURL(url);
            await imageRef.delete();
          }
        }

        const docId = querySnapshot.docs[0].id;
        await db.collection("posts").doc(docId).update({
          postId: urlId,
          title: title,
          content: newContent,
          answer: answer,
          uid: user.uid,
          displayName: userName,
          imageURL: imageURLs,
          userPhotoURL: userPhotoURLToSave,
        });
        alert("업로드에 성공했습니다.");
        navigate("/");
      } else {
        const docRef = db.collection("posts").doc(urlId);
        await docRef.set({
          postId: postId,
          title: title,
          content: newContent,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          answer: answer,
          uid: user.uid,
          displayName: userName,
          imageURL: imageURLs,
          userPhotoURL: userPhotoURLToSave,
        });
        alert("업로드에 성공했습니다.");
        navigate("/");
      }
    } else {
      const docRef = db.collection("posts").doc(postId);
      await docRef.set({
        postId: postId,
        title: title,
        content: newContent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        answer: answer,
        uid: user.uid,
        displayName: userName,
        imageURL: imageURLs,
        userPhotoURL: userPhotoURLToSave,
      });
      alert("업로드에 성공했습니다.");
      navigate("/");
    }

    fetchPosts();
  };

  return (
    <div className="w-[1080px] mx-auto">
      <StyledForm onSubmit={handleSubmit}>
        <h1 className="text-6xl">글 쓰기</h1>
        <StyledTitle
          type="text"
          value={title}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
          placeholder="제목을 입력하세요"
        />
        <StyledReactQuill
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          placeholder="Compose an epic..."
          theme="snow"
        />
        <div className="mb-6 mt-12">
          <label htmlFor="success" className="block mb-2 text-sm font-medium text-green-700 dark:text-green-500">
            정답 입력
          </label>
          <input
            type="text"
            id="success"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAnswer(event.target.value)}
            className="bg-green-50 border border-green-500 text-green-900 dark:text-green-400 placeholder-green-700 dark:placeholder-green-500 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-green-500"
            placeholder="정답을 입력해주세요."
            value={answer}
            required
          />
        </div>
        <StyledButton type="submit">Submit</StyledButton>
      </StyledForm>
    </div>
  );
};

export default PostEditor;
