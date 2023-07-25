import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../../firebase";
import ChangePwPopup from "../Components/ChangePwPopup";
import { useNavigate } from "react-router-dom";

const ProfileEdit = () => {
  // 상태 변수 정의
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [produce, setProduce] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // URL에서 uid 가져오기
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // submit
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      // Firestore에서 사용자 정보 업데이트
      await db.collection("users").doc(uid).update({
        email,
        name,
        produce,
      });

      // 이미지 업로드
      if (file) {
        // 기존 이미지 삭제
        if (user && user.avatar) {
          const storageRef = storage.refFromURL(user.avatar);
          await storageRef.delete();
        }

        // 새 이미지 업로드
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`images/${uid}`);
        await fileRef.put(file);
        const fileUrl = await fileRef.getDownloadURL();

        // Firestore에 이미지 URL 저장
        await db.collection("users").doc(uid).update({
          avatar: fileUrl,
        });
      }

      alert("변경되었습니다");
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  // 컴포넌트가 마운트될 때 데이터 가져오기
  useEffect(() => {
    // Firestore에서 사용자 정보 가져오기
    db.collection("users")
      .doc(uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          if (userData) {
            setUser(userData);
            setEmail(userData.email);
            setName(userData.name);
            setProduce(userData.produce);
          }
        }
      });
  }, [uid]);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Firebase Storage에서 이미지 URL 가져오기
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`images/${uid}`);
        const imageURL = await imageRef.getDownloadURL();
        setImage(imageURL);
      } catch (error) {
        console.error(error);
      }
    };
    fetchImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };

  return (
    <div className="w-[1280px] mx-auto flex items-center justify-center">
      <form className="mt-20" onSubmit={handleSubmit}>
        <div className="md:space-y-2 mb-3">
          <div className="flex items-center py-6 mb-10">
            <div className="w-24 h-24 mr-4 flex-none rounded-2xl border overflow-hidden">
              {image ? (
                <img className="w-24 h-24 mr-4 object-cover" src={image} alt="Avatar Upload" />
              ) : (
                <img className="w-24 h-24 mr-4 object-cover" src="/noImage.png" alt="No Image" />
              )}
            </div>
            <label className="cursor-pointer ">
              <span className="focus:outline-none text-white text-lg py-2 px-4 rounded-full bg-green-400 hover:bg-green-500 hover:shadow-lg">
                이미지 업로드
              </span>
              <input type="file" onChange={handleImageChange} hidden />
            </label>
          </div>
        </div>
        <div className="relative z-0 w-[680px] mb-10 group">
          <input
            type="email"
            name="floating_email"
            id="floating_email"
            className="block py-2.5 px-0 w-full text-xl text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label
            htmlFor="floating_email"
            className="peer-focus:font-medium absolute text-xl text-gray-500 left-0 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 text-sm peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            이메일(아이디)
          </label>
        </div>
        <div className="grid md:grid-cols-2 md:gap-10 mb-6">
          <div className="relative z-0 w-[500px] mb-6 group">
            <input
              type="text"
              name="floating_first_name"
              id="floating_first_name"
              className="block py-2.5 px-0 w-full text-xl text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {showPopup && <ChangePwPopup showPopup={showPopup} onClose={handleClosePopup} />}
            <label
              htmlFor="floating_first_name"
              className="peer-focus:font-medium absolute text-xl text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 left-0 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              이름
            </label>
          </div>
          <button type="button" onClick={() => setShowPopup(true)} className="btn btn-warning w-[140px]">
            비밀번호 변경
          </button>
        </div>
        <div className="relative z-0 w-[680px] mb-6 group">
          <textarea
            id="floating_first_name"
            className="block p-2 pl-2 px-0 w-full h-[200px] text-xl text-gray-900 bg-transparent border-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={produce}
            onChange={(e) => setProduce(e.target.value)}
            required
          />

          {showPopup && <ChangePwPopup showPopup={showPopup} onClose={handleClosePopup} />}
          <label
            htmlFor="floating_first_name"
            className="peer-focus:font-medium absolute text-xl text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 left-2 top-0 -z-10 origin-[0] peer-focus:left-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            내 소개
          </label>
        </div>
        <div>
          <button type="submit" className="btn btn-info mt-20">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
