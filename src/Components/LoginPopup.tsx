import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, UserCredential } from "firebase/auth";
import { FormEvent, useState } from "react";
import { db, signInWithGoogle } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const auth = getAuth();
const provider = new GoogleAuthProvider();

const Div = styled.div`
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 520px;
  width: 500px;
  z-index: 9999;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

interface PopupProps {
  onClose: () => void;
}

const LoginPopup = ({ onClose }: PopupProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleGoogleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (error) {
      console.error(error);
      alert("아이디와 비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    signInWithGoogle()
      .then(async (res: UserCredential) => {
        const credential = GoogleAuthProvider.credentialFromResult(res);
        const token = credential?.accessToken;
        const user = res.user;

        console.log(user);

        if (user) {
          // Firestore 데이터베이스에서 사용자 정보 조회
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          const name = user.displayName;
          const email = user.email;
          const photoURL = user.photoURL;
          const uid = user.uid;

          console.log(name, email, photoURL);

          if (docSnap.exists()) {
            // 사용자 정보가 존재하는 경우
            // ...
            console.log("이미 로그인 정보가 있습니다.");
          } else {
            // 사용자 정보가 존재하지 않는 경우
            if (photoURL) {
              // Firebase Storage에 사용자 프로필 사진 저장
              const storage = getStorage();
              const storageRef = ref(storage, `images/${uid}`);
              const response = await fetch(photoURL);
              const blob = await response.blob();
              await uploadBytes(storageRef, blob);
            }
            await setDoc(docRef, {
              name: name,
              email: email,
              uid: uid,
              photoURL: photoURL,
              rankPoint: 0,
            });
            console.log("로그인 정보가 없습니다");
          }
        }
        onClose();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Div className="fixed">
        <section>
          <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
            <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
              <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                  로그인
                </h1>
                <form className="space-y-4 md:space-y-6" onSubmit={handleGoogleSubmit}>
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-left text-sm font-medium text-gray-900 dark:text-white"
                    >
                      ID
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="id"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-2 text-left text-sm font-medium text-gray-900 dark:text-white"
                    >
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="bg-gray-100">
                        <button
                          className="flex items-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          onClick={handleLogin}
                        >
                          <svg
                            className="h-6 w-6 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            width="800px"
                            height="800px"
                            viewBox="-0.5 0 48 48"
                            version="1.1"
                          >
                            {" "}
                            <title>Google-color</title> <desc>Created with Sketch.</desc> <defs> </defs>{" "}
                            <g id="Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                              {" "}
                              <g id="Color-" transform="translate(-401.000000, -860.000000)">
                                {" "}
                                <g id="Google" transform="translate(401.000000, 860.000000)">
                                  {" "}
                                  <path
                                    d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                                    id="Fill-1"
                                    fill="#FBBC05"
                                  >
                                    {" "}
                                  </path>{" "}
                                  <path
                                    d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                                    id="Fill-2"
                                    fill="#EB4335"
                                  >
                                    {" "}
                                  </path>{" "}
                                  <path
                                    d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                                    id="Fill-3"
                                    fill="#34A853"
                                  >
                                    {" "}
                                  </path>{" "}
                                  <path
                                    d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                                    id="Fill-4"
                                    fill="#4285F4"
                                  >
                                    {" "}
                                  </path>{" "}
                                </g>{" "}
                              </g>{" "}
                            </g>{" "}
                          </svg>
                          <span>Continue with Google</span>
                        </button>
                      </div>
                    </div>
                    <a href="#" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">
                      Forgot password?
                    </a>
                  </div>
                  <button
                    type="submit"
                    className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                  >
                    Sign in
                  </button>
                  <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    Don’t have an account yet?{" "}
                    <Link
                      to="/signup"
                      onClick={onClose}
                      className="font-medium text-primary-600 hover:underline dark:text-primary-500 ml-20"
                    >
                      Sign up
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </Div>
    </>
  );
};

export default LoginPopup;
