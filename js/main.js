// 标签切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 标签切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;

            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 添加当前活动状态
            this.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
        });
    });
});

// 分类筛选切换
function toggleCategories() {
    const filters = document.getElementById('categoryFilters');
    filters.classList.toggle('active');
}

// 搜索功能
function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) return;

    // 获取所有文章卡片
    const cards = document.querySelectorAll('.article-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.article-title').textContent.toLowerCase();
        const author = card.querySelector('.article-author').textContent.toLowerCase();
        const desc = card.querySelector('.article-desc').textContent.toLowerCase();
        
        if (title.includes(query) || author.includes(query) || desc.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 回车搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 导航高亮
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// 文章筛选功能
function filterArticles(filterType, filterValue) {
    const cards = document.querySelectorAll('.article-card');
    
    cards.forEach(card => {
        if (filterType === 'all') {
            card.style.display = 'block';
        } else if (filterType === 'priority') {
            card.style.display = card.dataset.priority === filterValue ? 'block' : 'none';
        } else if (filterType === 'author') {
            card.style.display = card.dataset.author === filterValue ? 'block' : 'none';
        }
    });
}

// 复选框筛选
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.category-filters input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });
});

function applyFilters() {
    const cards = document.querySelectorAll('.article-card');
    
    // 获取选中的筛选条件
    const selectedPriorities = Array.from(document.querySelectorAll('.filter-priority:checked')).map(cb => cb.value);
    const selectedAuthors = Array.from(document.querySelectorAll('.filter-author:checked')).map(cb => cb.value);
    const selectedTypes = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);
    
    cards.forEach(card => {
        const priority = card.dataset.priority;
        const author = card.dataset.author;
        const type = card.dataset.type;
        
        let show = true;
        
        if (selectedPriorities.length > 0 && !selectedPriorities.includes(priority)) {
            show = false;
        }
        if (selectedAuthors.length > 0 && !selectedAuthors.includes(author)) {
            show = false;
        }
        if (selectedTypes.length > 0 && !selectedTypes.includes(type)) {
            show = false;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}
