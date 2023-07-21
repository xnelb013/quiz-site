import { Timestamp } from "firebase/firestore";

export interface Comment {
  id: string; // 댓글 문서의 id
  content: string;
  createdAt: Timestamp;
  name: string;
  postId: string;
  uid: string;
  photoURL: string;
}
