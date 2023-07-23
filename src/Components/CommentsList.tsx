// CommentsList.tsx
import { useEffect, useState } from "react";
import { Comment } from "../../Comment";
import { db, storage } from "../../firebase";
import Pagination from "./Pagination";

interface CommentsListProps {
  comments: Comment[];
  currentUid: string | null; // 현재 로그인한 사용자의 uid
}

const CommentsList: React.FC<CommentsListProps> = ({ comments, currentUid }) => {
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호를 상태로 관리합니다.
  const [postsPerPage] = useState(10); // 한 페이지에 보여줄 댓글 수를 상수로 정의합니다.

  const paginate = (comments: Comment[]) => {
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    return comments.slice(indexOfFirstPost, indexOfLastPost);
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      try {
        await db.collection("comments").doc(commentId).delete();
        alert("댓글이 성공적으로 삭제되었습니다.");
      } catch (error) {
        alert("오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };
  return (
    <>
      {/* 댓글 리스트 렌더링 */}
      <div className="w-fullbg-white rounded-lg border p-1 md:p-0 m-0">
        <h3 className="font-semibold p-1">댓글</h3>
        {paginate(comments).map((comment, index) => (
          <div className="flex" key={index}>
            <div className="flex-shrink-1 mr-3">
              <img
                className="mt-2 rounded-full lg:w-16 lg:h-16 sm:w-10 sm:h-10 mt-5"
                src={comment.userPhotoURL}
                alt="프로필이미지"
              />
            </div>
            <div className="flex-1 border border-blue-500 rounded-lg px-4 py-2 sm:px-6 sm:py-4 leading-relaxed text-left">
              <strong className="text-2xl mr-3">{comment.name}</strong>{" "}
              <span className="text-lg text-gray-400">{comment.createdAt.toDate().toLocaleDateString()}</span>
              <div className="flex mt-4">
                <p className="text-lg flex-1">{comment.content}</p>
                {comment.uid === currentUid && ( // 현재 로그인한 사용자의 댓글일 경우에만 삭제 버튼 표시
                  <button className="mt-2 text-right" onClick={() => handleDelete(comment.id)}>
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination
        totalPosts={comments.length} // 전체 댓글 수를 전달합니다.
        postsPerPage={postsPerPage} // 한 페이지에 보여줄 댓글 수를 전달합니다.
        currentPage={currentPage} // 현재 페이지 번호를 전달합니다.
        setCurrentPage={setCurrentPage} // 현재 페이지 번호를 설정하는 함수를 전달합니다.
      />
    </>
  );
};

export default CommentsList;
