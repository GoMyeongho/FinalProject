package com.kh.back.service;


import com.kh.back.constant.Authority;
import com.kh.back.entity.Member;
import com.kh.back.jwt.TokenProvider;
import com.kh.back.repository.MemberRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.CrossOrigin;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
@Service
@AllArgsConstructor // 생성자를 통한 의존성 주입을 받기 위해서 모든
public class MemberService {
	private MemberRepository memberRepository;
	private TokenProvider tokenProvider;
	private PasswordEncoder passwordEncoder;
	private final HttpServletRequest request;


//	// 전체 회원 조회
//	public List<MemberPublicResDto> allMember() {
//		try {
//			List<Member> members = memberRepository.findAll();
//			// 프론트 엔드에 정보를 전달하기 위해 DTO List 를 생성
//			List<MemberPublicResDto> memberResDtoList = new ArrayList<>();
//			for (Member member : members) {
//				memberResDtoList.add(convertEntityToDto(member));
//			}
//			return memberResDtoList;
//		} catch (Exception e) {
//			log.error("전체 조회 실패 : {}", e.getMessage());
//			return null;
//		}
//	}

//	// 특정 회원 조회
//	public MemberPublicResDto findMemberByEmail(String email) {
//		Member member = memberRepository.findByEmail(email)
//				.orElseThrow(() -> new RuntimeException("해당 회원이 존재하지 않습니다."));
//		return convertEntityToDto(member);
//	}

//	public MemberPublicResDto findEmailByPhone(String phone) {
//		Member member = memberRepository.findEmailByPhone(phone)
//				.orElseThrow(() -> new RuntimeException("해당 회원이 존재하지 않습니다."));
//		return convertEntityToDto(member);
//	}

	public boolean checkPassword(String token, String password) {
		Long memberId = getMemberId(token);
		System.out.println(password);
		System.out.println(memberId);
		request.getSession().setAttribute("memberId", memberId);
		Optional<Member> memberOptional = memberRepository.findById(memberId);  // 이메일로 회원 조회

		if (memberOptional.isPresent()) {
			Member member = memberOptional.get();
			// 입력된 평문 비밀번호와 DB에 저장된 암호화된 비밀번호 비교
			return passwordEncoder.matches(password, member.getPwd());
		}

		return false;  // 이메일이 존재하지 않으면 false 반환
	}
	public boolean deleteMember(Long memberId) {
		try {
			Member member = memberRepository.findById(memberId)
					.orElseThrow(() -> new RuntimeException("해당 회원이 존재하지 않습니다."));

			// 회원 상태를 SECESSION으로 변경
			member.setAuthority(Authority.REST_USER);
			member.setEmail(memberId + "deleted" + UUID.randomUUID());
			member.setPwd( memberId + "password" + UUID.randomUUID());
			member.setName(null);
			member.setPhone(null);
			member.setRegDate(null);
			member.setAuthority(null);
			member.setUserId(memberId + "deleted" + UUID.randomUUID());
			memberRepository.save(member);

			return true;
		} catch (Exception e) {
			log.error("회원 탈퇴 처리에 실패 했습니다 : {}", e.getMessage());
			return false;
		}
	}

	public String getRole(String token) {
		return convertTokenToEntity(token).getAuthority().toString();
	}
	
	public long getMemberId(String token) {
		try {
			Member member = convertTokenToEntity(token);
			return member.getMemberId(); // memberId 반환
		} catch (Exception e) {
			// 예외 로깅
			e.printStackTrace();
			throw new RuntimeException("수익금 가져오기 실패", e);
		}
	}
	
	// 토큰에서 Member 객체를 받아오는 메서드( 클래스 외부에서도 불러올 수 있게 public )
	public Member convertTokenToEntity(String token) {
		try{
			// 토큰 앞에 있는 "Bearer " 제거
			token = token.replace("Bearer ", "");
			// token 을 통해 memberId를 담고 있는 객체 Authentication 을 불러옴
			Authentication authentication = tokenProvider.getAuthentication(token);
			log.warn("Authentication 의 형태 : {}", authentication);
			// Name 은 String 으로 되어 있기 때문에 Long으로 바꿔주는 과정이 있어야 타입이 일치
			Long id = Long.parseLong(authentication.getName());
			Member member = memberRepository.findById(id)
				.orElseThrow(()-> new RuntimeException("존재 하지 않는 memberId 입니다."));

			// 이메일을 반환하여 클라이언트에서 처리하도록 함
			String email = member.getEmail();
			String nickName = member.getNickName();
			Long memberId = member.getMemberId();
			log.warn("토큰으로부터 얻은 이메일: {}", email);
			log.warn("토큰으로부터 얻은 닉네임: {}", nickName);
			log.warn("토큰으로부터 얻은 멤버아이디: {}", memberId);
			log.warn("토큰으로부터 얻은 Member: {}", member);
			return member;
		} catch (Exception e) {
			log.error(e.getMessage());
			return null;
		}
	}

	public void updatePassword(String newPassword, PasswordEncoder passwordEncoder) {
		Long memberId = (Long) request.getSession().getAttribute("memberId"); // 수정된 세션 접근 방식
		System.out.println("세션 ID: " + request.getSession().getId());
		if (memberId == null) {
			throw new RuntimeException("정보가 만료 되었습니다. 인증을 다시 진행해주세요.");
		}
		Optional<Member> memberOptional = memberRepository.findById(memberId);
		Member member = memberOptional.orElseThrow(() -> new RuntimeException("이메일에 해당하는 회원이 존재하지 않습니다."));

		String encodedPassword = passwordEncoder.encode(newPassword);
		member.setPwd(encodedPassword);
		memberRepository.save(member);
		request.getSession().removeAttribute("memberId"); // 세션에서 이메일 제거
	}



	public boolean changeNickName(String token, String nickname) {

		Long memberId =getMemberId(token);
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new RuntimeException("해당 이메일의 회원을 찾을 수 없습니다."));

		// 닉네임 변경
		member.setNickName(nickname);
		memberRepository.save(member); // 변경 사항 저장
		return true;
	}

//	// 회원 정보 수정
//	public boolean updateMember(MemberReqDto memberReqDto) {
//		try {
//			Member member = memberRepository.findByEmail(memberReqDto.getEmail())
//				.orElseThrow(() -> new RuntimeException("해당 회원이 존재하지 않습니다."));
//			member.setName(memberReqDto.getName());
//			memberRepository.save(member);
//			return true;
//		} catch (Exception e) {
//			log.error("회원 정보 수정중 오류 : {}", e.getMessage());
//			return false;
//		}
//	}




//	// Member Entity -> 회원 정보 DTO
//	private MemberPublicResDto convertEntityToDto(Member member) {
//		MemberPublicResDto memberResDto = new MemberPublicResDto();
//		memberResDto.setEmail(member.getEmail());
//		memberResDto.setName(member.getName());
////		memberResDto.setRegDate(member.getRegDate());
////		memberResDto.setPhone(m)
//		memberResDto.setRegDate(member.getRegDate());
//		return memberResDto;
//	}

	/**
	 * isAdmin 메서드
	 * KR: 회원 ID를 받아 해당 회원의 authority 필드를 검사합니다.
	 *     ROLE_ADMIN이면 true를 반환하여 관리자인지 확인합니다.
	 *
	 * @param memberId 회원 ID (Long)
	 * @return true if the member is an admin, false otherwise.
	 */
	public boolean isAdmin(Long memberId) {
		// 회원을 조회하고, authority가 ROLE_ADMIN이면 true 반환
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new IllegalArgumentException("유효하지 않은 회원 ID입니다: " + memberId));
		return member.getAuthority() == Authority.ROLE_ADMIN;
	}

	// Optionally, if you want an overload that accepts a token:
	/**
	 * isAdmin 메서드 (토큰 사용)
	 * KR: 토큰에서 회원을 추출한 후, 해당 회원의 authority를 검사하여 관리자 여부를 반환합니다.
	 *
	 * @param token 인증 토큰 (Bearer 토큰 포함 가능)
	 * @return true if the extracted member is an admin, false otherwise.
	 */
	public boolean isAdmin(String token) {
		Member member = convertTokenToEntity(token);
		if (member == null) {
			throw new IllegalArgumentException("토큰에서 회원 정보를 가져올 수 없습니다.");
		}
		return member.getAuthority() == Authority.ROLE_ADMIN;
	}

}