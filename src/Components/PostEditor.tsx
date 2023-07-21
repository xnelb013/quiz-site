import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";
import { app, db, storage } from "../../firebase";
import { useParams } from "react-router-dom";
import firebase from "firebase/compat/app";

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
  const [userName, setuserName] = useState("");
  const [title, setTitle] = useState("");
  const [answer, setAnswer] = useState("");
  const { urlId } = useParams<{ urlId: string }>();
  const [posts, setPosts] = useState<Post[]>([]);

  const postId = `${Date.now()}`;

  console.log(urlId);

  const modules = {
    toolbar: [[{ header: [1, 2, false] }], ["bold", "italic", "underline"], ["image", "code-block"]],
  };

  const fetchPosts = async () => {
    const user = app.auth().currentUser;
    if (!user) {
      // alert("로그인이 필요합니다.");
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
    console.log(userData);
    const displayName = userData.name;
    setuserName(displayName);
    console.log(displayName);

    console.log(uid);
    const querySnapshot = await db.collection("posts").where("postId", "==", urlId).get();
    const postsData: Post[] = querySnapshot.docs.map((doc) => ({ postId: doc.id, ...doc.data() } as Post));
    setPosts(postsData);
    console.log(postsData);

    if (postsData.length > 0) {
      setTitle(postsData[0].title);
      setContent(postsData[0].content);
      setAnswer(postsData[0].answer);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log(content);
    const user = app.auth().currentUser;
    console.log(user);
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!userName) {
      await fetchPosts();
    }

    // Find image tags in Quill editor content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const images = doc.querySelectorAll("img");

    // Upload first image to Firebase Storage and get download URL
    let imageURL = "";
    if (images.length > 0) {
      const img = images[0];
      const response = await fetch(img.src);
      const blob = await response.blob();
      const ref = storage.ref().child(`postImages/${postId}`);
      await ref.put(blob);
      imageURL = await ref.getDownloadURL();
    }

    // Get user profile picture download URL
    let photoURL = "";
    try {
      photoURL = await storage.ref().child(`images/${user.uid}`).getDownloadURL();
    } catch (error) {
      console.error(error);
    }

    // Check if post exists
    if (urlId) {
      // Check if post exists
      const querySnapshot = await db.collection("posts").where("postId", "==", urlId).get();
      if (!querySnapshot.empty) {
        // Get existing post data
        const doc = querySnapshot.docs[0];
        const postData = doc.data() as Post;

        // Delete existing image from Firebase Storage
        if (postData.imageURL) {
          const imageRef = storage.refFromURL(postData.imageURL);
          await imageRef.delete();
        }

        // Update existing post
        const docId = querySnapshot.docs[0].id;
        await db.collection("posts").doc(docId).update({
          postId: postId,
          title: title,
          content,
          answer: answer,
          uid: user.uid,
          displayName: userName,
          email: user.email,
          photoURL: photoURL,
          imageURL: imageURL,
        });
      } else {
        // Add new post
        const docRef = db.collection("posts").doc(postId);
        await docRef.set({
          postId: postId,
          title: title,
          content,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          answer: answer,
          uid: user.uid,
          displayName: userName,
          email: user.email,
          photoURL: photoURL,
          imageURL: imageURL,
        });
      }
    } else {
      // Add new post
      const docRef = db.collection("posts").doc(postId);
      await docRef.set({
        postId: postId,
        title: title,
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        answer: answer,
        uid: user.uid,
        displayName: userName,
        email: user.email,
        photoURL: photoURL,
        imageURL: imageURL,
      });
    }
    console.log(userName);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <StyledForm onSubmit={handleSubmit}>
      <h1 className="text-6xl">글 쓰기</h1>

      <StyledTitle
        type="text"
        value={title}
        onChange={(event: { target: { value: React.SetStateAction<string> } }) => setTitle(event.target.value)}
        placeholder="제목을 입력하세요"
      />
      <StyledReactQuill
        value={content}
        onChange={setContent}
        modules={modules}
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
          onChange={(event) => setAnswer(event.target.value)}
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
