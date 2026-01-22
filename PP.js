/* PP.js - 최종 완성본 (뒤로 가기 기능 추가)
   1. 기존 기능(그리드, 필터, 모달, 크레딧 헤더) 100% 유지
   2. 브라우저 '뒤로 가기' 버튼 지원 (모달 닫기, 전체 목록으로 돌아가기)
*/

// =========================================
// 1. 사이드바 & 네비게이션 UI 기능
// =========================================

// 사이드바 토글
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if(sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

// 인트로 화면 -> 메인 화면 진입
function enterSite() {
    const introSection = document.getElementById('introSection');
    const mainContainer = document.getElementById('mainContent');
    const mainContainerClass = document.querySelector('.main-container'); 
    const topBar = document.getElementById('topBar');

    if(introSection) introSection.classList.add('hidden');
    
    if (mainContainer) mainContainer.classList.add('active');
    if (mainContainerClass) mainContainerClass.classList.add('active');

    if (topBar) topBar.classList.remove('transparent');

    document.body.style.overflowY = 'auto';
    window.scrollTo(0, 0);
}

// 로고 클릭 시 인트로로 리셋
function resetToIntro() {
    const introSection = document.getElementById('introSection');
    const mainContainer = document.querySelector('.main-container');
    const topBar = document.getElementById('topBar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.classList.remove('active');

    if (introSection) introSection.classList.remove('hidden');
    if (mainContainer) mainContainer.classList.remove('active');
    if (topBar) topBar.classList.add('transparent');

    document.body.style.overflowY = 'hidden';
    window.scrollTo(0, 0);

    // URL 초기화
    history.pushState(null, null, window.location.pathname);
}

// =========================================
// 2. 프로젝트 로드 & 필터링 시스템
// =========================================

// 메뉴 클릭 시 실행되는 트리거 (뒤로 가기 기록 추가)
function triggerMenuClick(category) {
    // 1. UI 업데이트
    updateFilterUI(category);

    // 2. 브라우저 히스토리에 기록 (뒤로 가기 가능하게)
    if (category === 'all') {
        history.pushState({ view: 'all' }, null, window.location.pathname);
    } else {
        history.pushState({ view: 'category', category: category }, null, `?category=${category}`);
    }
}

// 실제 화면을 바꾸는 함수 (UI 로직 분리)
function updateFilterUI(category) {
    // 메뉴 활성화 상태 변경
    const links = document.querySelectorAll('.menu-link');
    links.forEach(link => link.classList.remove('active'));
    
    links.forEach(link => {
        if(link.textContent.trim() === category || link.getAttribute('onclick')?.includes(category)) {
            link.classList.add('active');
        }
    });

    // 뷰 필터링 실행
    filterView(category);

    // 모바일이면 사이드바 닫기
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 뷰 필터링 로직
function filterView(mode) {
    const wrapper = document.querySelector('.sections-wrapper');
    const sections = document.querySelectorAll('.category-section');

    // [Mode: All]
    if (mode === 'all' || mode === 'All') {
        if (wrapper) wrapper.classList.remove('single-view');
        
        sections.forEach(sec => {
            sec.style.display = 'block';
            const cards = sec.querySelectorAll('.project-card');
            cards.forEach(card => {
                // Featured만 노출
                if (card.classList.contains('is-featured')) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    } 
    // [Mode: Specific]
    else {
        if (wrapper) wrapper.classList.add('single-view');
        
        sections.forEach(sec => {
            if (sec.id === `sec-${mode}`) {
                sec.style.display = 'block';
                const cards = sec.querySelectorAll('.project-card');
                cards.forEach(c => c.style.display = 'flex');
            } else {
                sec.style.display = 'none';
            }
        });
    }
}

// 프로젝트 데이터 로드
function loadProjects() {
    if (typeof projectData === 'undefined') return;

    projectData.forEach(project => {
        project.categories.forEach(cat => {
            const gridId = `grid-${cat}`;
            const container = document.getElementById(gridId);
            
            if (container) {
                const card = document.createElement('article');
                let cardClasses = 'project-card';

                if (typeof featuredConfig !== 'undefined' && 
                    featuredConfig[cat] && 
                    featuredConfig[cat].includes(project.id)) {
                    cardClasses += ' is-featured';
                }

                card.className = cardClasses;
                
                // 클릭 시 모달 열기 (히스토리 기록은 openModal 내부에서 처리)
                card.onclick = function() {
                    openModal(project.id, true); // true = 히스토리 기록 함
                };

                const tagsHtml = project.tags.map(tag => {
                    let colorClass = 'blue';
                    if(tag.includes('CleanUp')) colorClass = 'green';
                    if(tag.includes('Camera')) colorClass = 'orange';
                    if(tag.includes('Director')) colorClass = 'purple';
                    return `<span class="tag ${colorClass}">${tag}</span>`;
                }).join('');

                card.innerHTML = `
                    <div class="card-cover" style="background-image: url('${project.image}')"></div>
                    <div class="card-content">
                        <div class="card-title">${project.title}</div>
                        <div class="card-desc">${project.desc}</div>
                        <div class="card-tags">${tagsHtml}</div>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    });
}

// =========================================
// 3. 모달 & 크레딧 기능
// =========================================

function openModal(projectId, pushHistory = false) {
    const project = projectData.find(p => p.id === projectId);
    if (!project) return;

    // 히스토리 기록 (URL 변경)
    if (pushHistory) {
        history.pushState({ view: 'modal', projectId: projectId }, null, `?project=${projectId}`);
    }

    const modal = document.getElementById('projectModal');
    
    // 기본 정보 주입
    document.getElementById('modalImg').src = project.image;
    document.getElementById('modalTitle').textContent = project.title;
    document.getElementById('modalDesc').textContent = project.desc;
    document.getElementById('modalInfo').innerText = project.detail.info;
    if(document.getElementById('modalDate')) {
        document.getElementById('modalDate').textContent = project.date || '';
    }

    // 태그 주입
    const modalTags = document.getElementById('modalTags');
    modalTags.innerHTML = project.tags.map(tag => `<span class="tag blue">${tag}</span>`).join('');

    // 링크 버튼 주입
    const modalLinks = document.getElementById('modalLinks');
    if(modalLinks) {
        modalLinks.innerHTML = "";
        if (project.links && project.links.length > 0) {
            project.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = "_blank";
                a.className = "link-btn";
                a.style.marginRight = "10px";
                
                let iconClass = 'fa-link';
                if(link.text.toLowerCase().includes('youtube') || link.url.toLowerCase().includes('youtu')) {
                    iconClass = 'fa-youtube';
                }
                
                a.innerHTML = `<i class="fab ${iconClass}"></i> ${link.text}`;
                modalLinks.appendChild(a);
            });
        }
    }

    // 크레딧 생성
    const creditList = document.getElementById('creditList');
    const creditSection = document.querySelector('.credit-section');

    if(creditList) {
        creditList.innerHTML = "";
        
        if (project.credits && project.credits.length > 0) {
            if(creditSection) creditSection.style.display = 'block';

            project.credits.forEach(item => {
                const li = document.createElement('li');

                if (item.header) {
                    li.className = 'credit-header'; 
                    li.textContent = item.header;
                    creditList.appendChild(li);
                } 
                else if (item.role && item.name) {
                    li.innerHTML = `
                        <span class="role">${item.role}</span>
                        <span class="name">${item.name}</span>
                    `;
                    creditList.appendChild(li);
                } 
                else if (item.text) {
                    const lines = item.text.split('\n');
                    lines.forEach(line => {
                        if(line.trim() === '') return;
                        const textLi = document.createElement('li');
                        textLi.innerHTML = `<span class="full-text">${line}</span>`;
                        creditList.appendChild(textLi);
                    });
                }
            });
        } else {
            if(creditSection) creditSection.style.display = 'none';
        }
    }

    // 크레딧 토글 초기화
    const creditContent = document.getElementById('creditContent');
    const creditBtn = document.querySelector('.credit-toggle-btn');
    if (creditContent) creditContent.classList.remove('open');
    if (creditBtn) creditBtn.classList.remove('active');

    // 모달 표시
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('projectModal');
    // 모달이 열려있는 상태에서 닫을 때만 히스토리 뒤로가기
    if (modal.classList.contains('active')) {
        // 현재 URL이 프로젝트 URL(?project=...)인지 확인
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('project')) {
            history.back(); // 브라우저 뒤로 가기 실행 -> popstate 이벤트가 발생하여 닫힘 처리됨
        } else {
            // URL 파라미터가 없으면 강제 닫기 (예외 처리)
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
}

function toggleCredits() {
    const content = document.getElementById('creditContent');
    const btn = document.querySelector('.credit-toggle-btn');
    
    if(content) content.classList.toggle('open');
    if(btn) btn.classList.toggle('active');
}

// =========================================
// 4. 초기화 & 뒤로 가기 감지 이벤트 (핵심)
// =========================================

// 브라우저 뒤로 가기/앞으로 가기 버튼 감지
window.addEventListener('popstate', (event) => {
    const modal = document.getElementById('projectModal');

    // 1. 모달 닫기 처리
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        return; // 모달 닫는 동작만 수행하고 종료
    }

    // 2. 카테고리 뷰 복구 처리
    const state = event.state;
    if (state && state.view === 'category') {
        updateFilterUI(state.category);
    } else {
        // 기본 상태 (All View)
        updateFilterUI('all');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. 프로젝트 생성
    loadProjects();

    // 2. 초기 로드 시 URL 파라미터 확인 (공유된 링크로 들어왔을 때)
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    const category = urlParams.get('category');

    if (projectId) {
        // 프로젝트 링크로 들어온 경우 -> 모달 바로 열기
        // 초기 상태(All View)를 먼저 기록해서 뒤로 가기 시 메인으로 가게 함
        history.replaceState({ view: 'all' }, null, window.location.pathname);
        updateFilterUI('all');
        openModal(projectId, true);
    } else if (category) {
        // 카테고리 링크로 들어온 경우
        updateFilterUI(category);
    } else {
        // 일반 접속
        updateFilterUI('all');
        // 초기 상태 기록
        history.replaceState({ view: 'all' }, null, window.location.pathname);
    }

    // 3. 스크롤 이벤트
    window.addEventListener('scroll', () => {
        const topBar = document.getElementById('topBar');
        if (!topBar) return;
        
        if (window.scrollY > 50) {
            topBar.classList.remove('transparent');
        } else {
            const intro = document.getElementById('introSection');
            if(intro && intro.classList.contains('hidden')) {
                // topBar.classList.add('transparent'); // 필요 시 주석 해제
            }
        }
    });
    
    document.body.style.overflowY = 'hidden';
});