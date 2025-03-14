import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import {
  fetchMemberDetails,
  createPurchaseRecord,
} from "../../api/CheckoutApi";
import "./style.css";
import axiosInstance from "../../api/AxiosInstance";

const generateRandomString = () => window.btoa(Math.random()).slice(0, 20);
const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [widgets, setWidgets] = useState(null);

  // ✅ 한 번에 관리할 결제 정보
  const [paymentDetails, setPaymentDetails] = useState({
    amount: { currency: "KRW", value: 8_900 },
    orderId: generateRandomString(),
    orderName: "맴버십 결제",
    customerName: "김토스",
    customerEmail: "customer123@gmail.com",
  });

  useEffect(() => {
    // ✅ API 호출로 구매자 정보 불러오기
    fetchMemberDetails()
      .then((response) => {
        const { name, email } = response.data;
        setPaymentDetails((prevDetails) => ({
          ...prevDetails,
          customerName: name,
          customerEmail: email,
        }));
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    async function fetchPaymentWidgets() {
      const tossPayments = await loadTossPayments(clientKey);
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
      setWidgets(widgets);
    }

    fetchPaymentWidgets();
  }, [clientKey]);

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return;
      }
      /**
       * 위젯의 결제금액을 결제하려는 금액으로 초기화하세요.
       * renderPaymentMethods, renderAgreement, requestPayment 보다 반드시 선행되어야 합니다.
       * @docs https://docs.tosspayments.com/sdk/v2/js#widgetssetamount
       */
      await widgets.setAmount(paymentDetails.amount);

      await Promise.all([
        /**
         * 결제창을 렌더링합니다.
         * @docs https://docs.tosspayments.com/sdk/v2/js#widgetsrenderpaymentmethods
         */
        widgets.renderPaymentMethods({
          selector: "#payment-method",
          // 렌더링하고 싶은 결제 UI의 variantKey
          // 결제 수단 및 스타일이 다른 멀티 UI를 직접 만들고 싶다면 계약이 필요해요.
          // @docs https://docs.tosspayments.com/guides/v2/payment-widget/admin#새로운-결제-ui-추가하기
          variantKey: "DEFAULT",
        }),
        /**
         * 약관을 렌더링합니다.
         * @docs https://docs.tosspayments.com/reference/widget-sdk#renderagreement선택자-옵션
         */
        widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT",
        }),
      ]);

      setReady(true);
    }

    renderPaymentWidgets();
  }, [widgets]);

  // ✅ 결제 정보 업데이트 메서드
  function setPaymentDetailsHandler(newDetails) {
    setPaymentDetails((prevDetails) => ({
      ...prevDetails,
      ...newDetails,
    }));
  }

  // ✅ 결제 정보 전송 메서드
  const handlePayment = async () => {
    try {
      /**
       * 결제 요청
       * 결제를 요청하기 전에 orderId, amount를 서버에 저장하세요.
       * 결제 과정에서 악의적으로 결제 금액이 바뀌는 것을 확인하는 용도입니다.
       * @docs https://docs.tosspayments.com/sdk/v2/js#widgetsrequestpayment
       */

      //PurchaseRecord 생성
      const purchaseRecordDto = {
        orderId: paymentDetails.orderId,
        orderName: paymentDetails.orderName,
        amount: paymentDetails.amount.value,
        customerName: paymentDetails.customerName,
        customerEmail: paymentDetails.customerEmail,
      };

      // axios 요청과 결제 위젯 요청을 병렬로 처리
      await Promise.all([
        // PurchaseRecord 저장을 위한 POST 요청
        createPurchaseRecord(purchaseRecordDto),

        // 결제 요청
        widgets?.requestPayment({
          orderId: paymentDetails.orderId,
          orderName: paymentDetails.orderName,
          customerName: paymentDetails.customerName,
          customerEmail: paymentDetails.customerEmail,
          successUrl:
            window.location.origin + "/pay/success" + window.location.search,
          failUrl:
            window.location.origin + "/pay/fail" + window.location.search,
        }),
      ]);
    } catch (error) {
      console.error("Payment request failed:", error);
      // TODO: 결제 실패 처리
    }
  };

  return (
    <div className="wrapper w-100">
      <div className="max-w-540 w-100">
        <div id="payment-method" className="w-100" />
        {paymentDetails && (
          <div className="payment-summary">
            <p>구매자: {paymentDetails.customerName}</p>
            <p>상품명: {paymentDetails.orderName}</p>
            <p>금액: {paymentDetails.amount.value}원</p>
          </div>
        )}
        <div id="agreement" className="w-100" />
        <div className="btn-wrapper w-100">
          <button
            className="btn primary w-100"
            onClick={handlePayment}
            disabled={!ready} // ready가 true일 때만 활성화
          >
            {ready ? "결제하기" : "로딩 중..."}{" "}
            {/* ready에 따라 버튼 텍스트 변경 */}
          </button>
        </div>
      </div>
    </div>
  );
}
