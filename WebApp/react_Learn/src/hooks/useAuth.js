import { useDispatch, useSelector } from "react-redux";
import { useAdminLoginMutation, useRequestOtpMutation, useVerifyOtpMutation } from "../store/api/authApi.js";
import { logout as logoutAction, setCredentials, setUser } from "../store/slices/authSlice.js";

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const [requestOtpMutation] = useRequestOtpMutation();
  const [verifyOtpMutation] = useVerifyOtpMutation();
  const [adminLoginMutation] = useAdminLoginMutation();

  async function requestOtp(email) {
    return requestOtpMutation(email).unwrap();
  }

  async function verifyOtp(email, code) {
    const data = await verifyOtpMutation({ email, code }).unwrap();
    if (data.status === "authenticated") {
      dispatch(setCredentials(data));
    }
    return data;
  }

  async function adminLogin(email, password) {
    const data = await adminLoginMutation({ email, password }).unwrap();
    dispatch(setCredentials(data));
    return data.user;
  }

  function setCurrentUser(updatedUser) {
    dispatch(setUser(updatedUser));
  }

  function logout() {
    dispatch(logoutAction());
  }

  return { user, loading, requestOtp, verifyOtp, adminLogin, setCurrentUser, logout };
}
