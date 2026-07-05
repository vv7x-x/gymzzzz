export function createPagination(currentPage, totalPages, onPageChange) {
  const container = document.createElement('div');
  container.className = 'pagination';
  container.setAttribute('role', 'navigation');
  container.setAttribute('aria-label', 'Pagination');

  const prevBtn = createArrowBtn('bi-chevron-left', currentPage <= 1, 'Previous page');
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  });
  container.appendChild(prevBtn);

  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    container.appendChild(createPageBtn(1, currentPage === 1, onPageChange));
    if (start > 2) {
      container.appendChild(createDots());
    }
  }

  for (let i = start; i <= end; i++) {
    container.appendChild(createPageBtn(i, i === currentPage, onPageChange));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      container.appendChild(createDots());
    }
    container.appendChild(createPageBtn(totalPages, currentPage === totalPages, onPageChange));
  }

  const nextBtn = createArrowBtn('bi-chevron-right', currentPage >= totalPages, 'Next page');
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  });
  container.appendChild(nextBtn);

  return container;
}

function createPageBtn(pageNum, isActive, onPageChange) {
  const btn = document.createElement('button');
  btn.className = `pagination-btn${isActive ? ' active' : ''}`;
  btn.textContent = pageNum;
  btn.setAttribute('aria-label', `Page ${pageNum}`);
  if (isActive) {
    btn.setAttribute('aria-current', 'page');
  }
  if (!isActive) {
    btn.addEventListener('click', () => onPageChange(pageNum));
  }
  return btn;
}

function createArrowBtn(icon, disabled, label) {
  const btn = document.createElement('button');
  btn.className = 'pagination-btn';
  btn.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i>`;
  btn.disabled = disabled;
  btn.setAttribute('aria-label', label);
  return btn;
}

function createDots() {
  const dots = document.createElement('span');
  dots.className = 'pagination-info';
  dots.textContent = '...';
  dots.setAttribute('aria-hidden', 'true');
  return dots;
}

export function paginateData(data, page, pageSize) {
  const size = pageSize || 10;
  const totalPages = Math.ceil(data.length / size) || 1;
  const start = (page - 1) * size;
  const items = data.slice(start, start + size);
  return { items, totalPages, currentPage: page, total: data.length };
}
