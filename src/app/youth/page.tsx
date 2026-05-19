import { DocPage } from "@/components/DocPage";

export const metadata = { title: "청소년 보호정책" };

export default function YouthPage() {
    return (
        <DocPage title="청소년 보호정책" version="v1" lastUpdated="2026-05-19">
            <p>
                엘프바 라운지(이하 &ldquo;회사&rdquo;)는 청소년이 유해정보로부터 보호받을 수 있도록 청소년
                보호법 및 관련 법령에 따라 청소년 보호정책을 수립·운영합니다.
            </p>

            <h2>1. 청소년 유해정보의 차단</h2>
            <p>
                본 사이트는 만 19세 이상 성인만 이용 가능한 콘텐츠를 다룹니다. 회사는 모든 이용자에 대해
                회원 가입 시 본인 확인 및 성인 인증(PASS 등)을 통해 청소년의 접근을 차단합니다.
            </p>

            <h2>2. 청소년 보호 책임자</h2>
            <p>성명: —, 연락처: —, 이메일: —</p>

            <h2>3. 신고 및 상담</h2>
            <p>
                청소년 유해정보 발견 시 위 책임자에게 신고해 주시기 바랍니다. 회사는 즉시 시정 조치를
                취합니다.
            </p>

            <p className="mt-8 text-xs text-zinc-500">
                * 본 방침의 상세 조항은 도급인 법무 검토 후 확정됩니다.
            </p>
        </DocPage>
    );
}
