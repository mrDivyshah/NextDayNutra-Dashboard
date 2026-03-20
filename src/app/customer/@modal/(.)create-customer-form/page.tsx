"use client";

import { useRouter } from "next/navigation";
import { CreateCustomerView } from "@/components/dashboard/CreateCustomerView";

export default function CreateCustomerFormModalPage() {
  const router = useRouter();
  const dismissModal = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/customer");
  };

  return (
    <div
      onClick={dismissModal}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 50,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(1380px, 100%)",
          maxHeight: "100%",
          overflow: "auto",
          borderRadius: 20,
          boxShadow: "0 28px 90px -28px rgba(15,23,42,0.55)",
        }}
      >
        <CreateCustomerView onBack={dismissModal} />
      </div>
    </div>
  );
}
