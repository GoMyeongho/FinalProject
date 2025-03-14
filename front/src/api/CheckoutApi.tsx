import axiosInstance from "./AxiosInstance";
import { PurchaseRecordDto } from "./dto/PurchaseRecordDto";

// ✅ 구매자 정보 불러오기
export const fetchMemberDetails = async () => {
  return axiosInstance.get("/api/member/get");
};

// ✅ PurchaseRecord 생성 (결제 정보 저장)
export const createPurchaseRecord = (data: PurchaseRecordDto) => {
  return axiosInstance.post("/api/purchase/create", data);
};
