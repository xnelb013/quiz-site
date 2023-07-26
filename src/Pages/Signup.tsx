import { ChangeEvent, FormEvent, useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// import { db } from "../../firebase";
import "firebase/compat/storage";

const Signup = () => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [produce, setProduce] = useState("");

  const navigate = useNavigate();

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!window.confirm("아이디 생성하시겠습니까?")) {
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 이미지 업로드
      if (file) {
        // Storage에 이미지 업로드
        const storage = getStorage();
        const storageRef = ref(storage, `images/${userCredential.user.uid}`);
        await uploadBytes(storageRef, file);

        // 이미지 다운로드 URL 가져오기
        const downloadURL = await getDownloadURL(storageRef);
        setImage(downloadURL);
      }

      // Firestore에 데이터 추가
      const db = getFirestore();
      await setDoc(doc(collection(db, "users"), userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name,
        gender,
        produce,
        rankPoint: 0,
      });

      console.log("User created successfully");
    } catch (error) {
      console.error(error);
    }
    navigate("/");
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="relative min-h-screen flex items-center justify-center bg-center py-12 px-4 sm:px-6 lg:px-8 bg-no-repeat bg-cover relative items-center">
          <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
          <div className="max-w-4xl w-full space-y-8 p-10 bg-white rounded-xl shadow-lg z-10">
            <div className="grid  gap-8 grid-cols-1">
              <div className="flex flex-col ">
                <div className="flex flex-col sm:flex-row items-center">
                  <h2 className="font-semibold text-2xl mr-auto">회원가입</h2>
                  <div className="w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0"></div>
                </div>
                <div className="mt-5">
                  <div className="form">
                    <div className="md:space-y-2 mb-3">
                      <label className="text-xs font-semibold text-gray-600 py-2">
                        프로필 사진
                        <abbr className="hidden" title="required">
                          *
                        </abbr>
                      </label>
                      <div className="flex items-center py-6">
                        <div className="w-12 h-12 mr-4 flex-none rounded-xl border overflow-hidden">
                          {image ? (
                            <img className="w-12 h-12 mr-4 object-cover" src={image} alt="Avatar Upload" />
                          ) : (
                            <img
                              className="w-12 h-12 mr-4 object-cover"
                              src="https://images.unsplash.com/photo-1611867967135-0faab97d1530?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&amp;ixlib=rb-1.2.1&amp;auto=format&amp;fit=crop&amp;w=1352&amp;q=80"
                              alt="Avatar Upload"
                            />
                          )}
                        </div>
                        <label className="cursor-pointer ">
                          <span className="focus:outline-none text-white text-sm py-2 px-4 rounded-full bg-green-400 hover:bg-green-500 hover:shadow-lg">
                            이미지 업로드
                          </span>
                          <input type="file" onChange={handleImageChange} hidden />
                        </label>
                      </div>
                    </div>
                    <div className="md:flex flex-row md:space-x-4 w-full text-xs">
                      <div className="mb-3 space-y-2 w-full text-xs">
                        <label className=" font-semibold text-gray-600 py-2">이메일(Email)</label>
                        <div className="flex flex-wrap items-stretch w-full mb-4 relative">
                          <div className="flex">
                            <span className="flex items-center leading-normal bg-grey-lighter border-1 rounded-r-none border border-r-0 border-blue-300 px-3 whitespace-no-wrap text-grey-dark text-sm w-12 h-10 bg-blue-300 justify-center items-center  text-xl rounded-lg text-white">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                            </span>
                          </div>
                          <input
                            type="email"
                            className="flex-shrink flex-grow flex-auto leading-normal w-px flex-1 border border-l-0 h-10 border-grey-light rounded-lg rounded-l-none px-3 relative focus:border-blue focus:shadow"
                            placeholder="please enter your email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <div className="mb-3 space-y-2 w-full text-xs">
                        <label className="font-semibold text-gray-600 py-2">
                          비밀번호(PASSWORD) <abbr title="required">*</abbr>
                        </label>
                        <input
                          placeholder="phone number"
                          className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4"
                          required
                          type="password"
                          name="password"
                          id="passwordId"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-red text-xs hidden">Please fill out this field.</p>
                      </div>
                    </div>

                    <div className="md:flex md:flex-row md:space-x-4 w-full text-xs">
                      <div className="w-full flex flex-col mb-3">
                        <label className="font-semibold text-gray-600 py-2">이름(NAME)</label>
                        <input
                          placeholder="Address"
                          className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4"
                          type="text"
                          name="name"
                          id="integration_street_address"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="w-full flex flex-col mb-3">
                        <label className="font-semibold text-gray-600 py-2">
                          성별(GENDER)<abbr title="required">*</abbr>
                        </label>
                        <select
                          className="block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4 md:w-full "
                          required
                          name="gender"
                          id="genderId"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="">선택해주세요.</option>
                          <option value="남성">남성</option>
                          <option value="여성">여성</option>
                        </select>
                        <p className="text-sm text-red-500 hidden mt-3" id="error">
                          Please fill out this field.
                        </p>
                      </div>
                    </div>
                    <div className="flex-auto w-full mb-1 text-xs space-y-2">
                      <label className="font-semibold text-gray-600 py-2">내 소개(PRODUCE)</label>
                      <textarea
                        required
                        name="message"
                        value={produce}
                        onChange={(e) => setProduce(e.target.value)}
                        id="produceId"
                        className="w-full min-h-[100px] max-h-[300px] h-28 appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg  py-4 px-4"
                        placeholder="Enter your comapny info"
                        spellCheck="false"
                      ></textarea>
                      <p className="text-xs text-gray-400 text-left my-3">You inserted 0 characters</p>
                    </div>
                    <p className="text-xs text-red-500 text-right my-3">
                      Required fields are marked with an asterisk <abbr title="Required field">*</abbr>
                    </p>
                    <div className="mt-5 text-right md:space-x-3 md:block flex flex-col-reverse">
                      <button className="mb-2 md:mb-0 bg-white px-5 py-2 text-sm shadow-sm font-medium tracking-wider border text-gray-600 rounded-full hover:shadow-lg hover:bg-gray-100">
                        {" "}
                        Cancel{" "}
                      </button>
                      <button className="mb-2 md:mb-0 bg-green-400 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-white rounded-full hover:shadow-lg hover:bg-green-500">
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
export default Signup;
