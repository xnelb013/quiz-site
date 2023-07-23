import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";
import { app, db, storage } from "../../firebase";
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
  imageURL: any;
  postId: string;
  title: string;
  content: string;
  uid: string;
  displayName: string;
  answer: string;
}

const PostEditor = () => {
  const [content, setContent] = useState("");
  const [updatedContent, setUpdatedContent] = useState("");
  const [userName, setUserName] = useState("");
  const [title, setTitle] = useState("");
  const [answer, setAnswer] = useState("");
  const { urlId } = useParams<{ urlId: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileImg, setProfileImg] = useState<string | null>(null);

  const navigate = useNavigate();
  const postId = nanoid();

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ["link", "image"],
      [{ align: [] }, { color: [] }, { background: [] }],
      ["clean"],
    ],
  };

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
      // If urlId is not provided, do not execute the query
      return;
    }

    const querySnapshot = await db.collection("posts").where("postId", "==", urlId).get();
    const postsData: Post[] = querySnapshot.docs.map((doc) => ({ postId: doc.id, ...doc.data() } as Post));
    setPosts(postsData);

    if (postsData.length > 0) {
      setTitle(postsData[0].title);
      setContent(postsData[0].content);
      setAnswer(postsData[0].answer);
    }
  };

  useEffect(() => {
    if (urlId) {
      fetchPosts();
    }
  }, [urlId]);

  useEffect(() => {
    console.log(updatedContent);
  }, [updatedContent]);

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

    // Wait for all image uploads to complete
    await Promise.all(promises);

    // Get download URLs for each image
    for (let i = 0; i < images.length; i++) {
      const ref = storage.ref().child(`postImages/${postId}/${i}`);
      const imageURL = await ref.getDownloadURL();
      imageURLs.push(imageURL);
    }

    const newContent = doc.body.innerHTML;

    // Get the user's photoURL
    const userDocRef = db.collection("users").doc(user.uid);
    const userDoc = await userDocRef.get();
    const userPhotoURL = userDoc.exists ? userDoc.data()?.photoURL : null;

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
          postId: postId,
          title: title,
          content: newContent,
          answer: answer,
          uid: user.uid,
          displayName: userName,
          imageURL: imageURLs,
          userPhotoURL: userPhotoURL,
        });
        alert("업로드에 성공했습니다.");
        navigate("/");
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
          userPhotoURL: userPhotoURL,
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
        userPhotoURL: userPhotoURL,
      });
      alert("업로드에 성공했습니다.");
      navigate("/");
    }

    fetchPosts();
  };

  return (
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
      <div>
        <h1>User Posts: {urlId}</h1>
      </div>
    </StyledForm>
  );
};

export default PostEditor;
