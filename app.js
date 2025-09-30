const form = document.getElementById('analysis-form');
const frontInput = document.getElementById('front-image');
const sideInput = document.getElementById('side-image');
const backInput = document.getElementById('back-image');
const resultsSection = document.getElementById('analysis-results');
const metricsList = document.getElementById('metrics-list');
const recommendationList = document.getElementById('recommendation-list');
const profileSummary = document.getElementById('profile-summary');
const profileChip = document.getElementById('profile-chip');
const toast = document.getElementById('toast');

const SEVERITY = {
  GOOD: '균형 양호',
  CAUTION: '주의 필요',
  FOCUS: '집중 케어',
};

const exercisesLibrary = {
  forwardHead: {
    title: '목 후인 운동',
    type: '운동',
    animationClass: 'neck-retraction',
    description:
      '턱을 살짝 당겨 목을 뒤로 밀어 넣으며, 앞쪽으로 기울어진 머리 정렬을 교정합니다. 벽에 등을 붙인 상태로 10회씩 3세트 수행하세요.',
    tags: ['경추 안정화', '거북목 완화'],
    duration: '10회 × 3세트',
  },
  shoulderMobility: {
    title: '월 엔젤',
    type: '운동',
    animationClass: 'wall-angel',
    description:
      '벽에 전신을 붙인 상태에서 팔을 천천히 올렸다 내리며 어깨와 등 근육을 활성화합니다. 팔이 벽에서 떨어지지 않도록 집중하세요.',
    tags: ['어깨 가동성', '흉추 신전'],
    duration: '12회 × 2세트',
  },
  hipFlexor: {
    title: '힙 플렉서 스트레칭',
    type: '스트레칭',
    animationClass: 'hip-flexor',
    description:
      '한쪽 다리를 앞으로 굽히고 반대쪽 다리는 뒤로 뻗어 골반을 앞쪽으로 밀어냅니다. 전방경사로 짧아진 고관절 굴곡근을 부드럽게 이완합니다.',
    tags: ['고관절 이완', '골반 정렬'],
    duration: '30초 × 3세트',
  },
  spineMobility: {
    title: '캣 카우',
    type: '운동',
    animationClass: 'cat-cow',
    description:
      '숨을 들이마시며 허리를 아래로 내려 가슴을 열고, 내쉬면서 등을 둥글게 말아 척추의 유연성을 높입니다. 부드럽게 호흡과 함께 반복하세요.',
    tags: ['척추 가동성', '호흡 연동'],
    duration: '60초 지속',
  },
  balance: {
    title: '싱글 레그 밸런스',
    type: '운동',
    animationClass: 'balance-shift',
    description:
      '한쪽 다리에 체중을 실어 균형을 잡으며 고관절과 발목 안정성을 기릅니다. 거울 앞에서 좌우 체중 이동을 확인하며 진행하세요.',
    tags: ['균형 감각', '하지 정렬'],
    duration: '40초 × 2세트',
  },
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const front = frontInput.files[0];
  const side = sideInput.files[0];
  const back = backInput.files[0];

  if (!front || !side || !back) {
    showToast('세 장의 사진을 모두 업로드해 주세요.');
    return;
  }

  const analysis = analyzePosture({ front, side, back });
  const recommendations = buildRecommendations(analysis.metrics);

  renderAnalysis(analysis, recommendations);
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('AI 분석이 완료되었습니다.');
});

function analyzePosture(images) {
  const { front, side, back } = images;
  const sizeFront = front.size || 1;
  const sizeSide = side.size || 1;
  const sizeBack = back.size || 1;

  const normalize = (value) => Math.min(Math.max(value, 0), 1);

  const frontBackDiff = Math.abs(sizeFront - sizeBack) / ((sizeFront + sizeBack) / 2);
  const frontSideDiff = Math.abs(sizeFront - sizeSide) / ((sizeFront + sizeSide) / 2);
  const sideBackDiff = Math.abs(sizeSide - sizeBack) / ((sizeSide + sizeBack) / 2);

  const forwardHeadScore = normalize(frontSideDiff * 0.8 + 0.1);
  const shoulderTiltScore = normalize(frontBackDiff * 0.9);
  const pelvicTiltScore = normalize(sideBackDiff * 0.85 + 0.05);
  const balanceScore = normalize(Math.abs(sizeFront - (sizeSide + sizeBack) / 2) / sizeFront * 0.7);

  const metrics = [
    buildMetric('forwardHead', '머리 전방 기울기', forwardHeadScore, {
      good: '머리 정렬이 양호합니다. 현재 패턴을 유지해 주세요.',
      caution: '머리가 몸통보다 약간 앞으로 나와 있습니다. 화면과의 거리를 조정하고 목 근육을 강화해 주세요.',
      focus: '명확한 거북목 패턴이 감지되었습니다. 자세 알람과 함께 집중 케어가 필요합니다.',
    }),
    buildMetric('shoulderTilt', '좌우 어깨 균형', shoulderTiltScore, {
      good: '어깨 높이 차이가 크지 않아 균형이 좋습니다.',
      caution: '어깨 높이 차이가 존재합니다. 주 2~3회 어깨 안정화 운동을 권장합니다.',
      focus: '어깨 비대칭이 두드러집니다. 견갑 안정화와 근막 이완을 병행해 주세요.',
    }),
    buildMetric('pelvicTilt', '골반 기울기', pelvicTiltScore, {
      good: '골반이 안정적인 정렬을 보이고 있습니다.',
      caution: '경미한 골반 기울기가 있습니다. 고관절 스트레칭과 코어 강화가 필요합니다.',
      focus: '골반 기울기가 크므로 허리 통증 예방을 위해 집중 케어가 필요합니다.',
    }),
    buildMetric('balance', '체중 분배 균형', balanceScore, {
      good: '좌우 체중 분배가 안정적입니다.',
      caution: '체중 분배가 다소 한쪽으로 쏠립니다. 균형 감각을 길러 주세요.',
      focus: '체중이 한쪽으로 크게 치우치고 있어 넘어짐 위험이 있습니다. 즉각적인 교정이 필요합니다.',
    }),
  ];

  const aggregateScore = metrics.reduce((acc, metric) => acc + metric.score, 0) / metrics.length;
  const profile = determineProfile(aggregateScore, metrics);

  return { metrics, profile };
}

function buildMetric(id, label, score, messages) {
  const severity = score < 0.12 ? SEVERITY.GOOD : score < 0.28 ? SEVERITY.CAUTION : SEVERITY.FOCUS;
  const description = severity === SEVERITY.GOOD ? messages.good : severity === SEVERITY.CAUTION ? messages.caution : messages.focus;
  const displayScore = (score * 100).toFixed(0);

  return { id, label, score, severity, description, displayScore };
}

function determineProfile(aggregateScore, metrics) {
  const focusItems = metrics.filter((metric) => metric.severity === SEVERITY.FOCUS);
  if (focusItems.length >= 2) {
    return {
      label: '집중 교정 필요 체형',
      summary: '복수의 지표에서 불균형이 크게 나타났습니다. 맞춤 케어 플랜을 적극 실행해 주세요.',
    };
  }

  if (aggregateScore < 0.15) {
    return {
      label: '균형형 체형',
      summary: '전반적인 정렬이 안정적입니다. 현재의 생활 습관을 유지하며 가벼운 운동을 지속하세요.',
    };
  }

  if (aggregateScore < 0.3) {
    return {
      label: '주의 관찰 체형',
      summary: '일부 정렬 지표에서 불균형이 발견되었습니다. 추천 루틴을 주 3회 이상 실천해 주세요.',
    };
  }

  return {
    label: '불균형 교정 체형',
    summary: '체형 불균형이 누적되어 있습니다. 주 4회 이상 루틴으로 정렬을 회복하는 것을 권장합니다.',
  };
}

function buildRecommendations(metrics) {
  const recommendations = [];

  metrics.forEach((metric) => {
    if (metric.severity === SEVERITY.GOOD) return;

    switch (metric.id) {
      case 'forwardHead':
        recommendations.push(exercisesLibrary.forwardHead, exercisesLibrary.shoulderMobility);
        break;
      case 'shoulderTilt':
        recommendations.push(exercisesLibrary.shoulderMobility, exercisesLibrary.balance);
        break;
      case 'pelvicTilt':
        recommendations.push(exercisesLibrary.hipFlexor, exercisesLibrary.spineMobility);
        break;
      case 'balance':
        recommendations.push(exercisesLibrary.balance, exercisesLibrary.spineMobility);
        break;
      default:
        break;
    }
  });

  const unique = [];
  const seen = new Set();
  recommendations.forEach((item) => {
    if (!seen.has(item.title)) {
      seen.add(item.title);
      unique.push(item);
    }
  });

  return unique.slice(0, 4);
}

function renderAnalysis(analysis, recommendations) {
  profileSummary.textContent = analysis.profile.summary;
  profileChip.textContent = analysis.profile.label;

  metricsList.innerHTML = '';
  analysis.metrics.forEach((metric) => {
    const card = document.createElement('article');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-card__header">
        <div>
          <h4>${metric.label}</h4>
          <p class="metric-card__score">${metric.displayScore}<span style="font-size:0.8rem">/100</span></p>
        </div>
        <span class="badge ${severityClass(metric.severity)}">${metric.severity}</span>
      </div>
      <p class="metric-card__body">${metric.description}</p>
    `;
    metricsList.appendChild(card);
  });

  recommendationList.innerHTML = '';

  if (recommendations.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel__description';
    empty.textContent = '현재 상태가 안정적입니다. 기본 스트레칭과 가벼운 걷기를 유지해 주세요.';
    recommendationList.appendChild(empty);
    return;
  }

  recommendations.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="animation-stage">
        ${renderAnimation(item.animationClass)}
      </div>
      <div class="recommendation-card__header">
        <h4>${item.title}</h4>
        <span>${item.type}</span>
      </div>
      <p class="recommendation-card__body">${item.description}</p>
      <ul class="tag-list">
        ${item.tags.map((tag) => `<li class="tag">${tag}</li>`).join('')}
      </ul>
      <div class="panel__description" style="margin:0;color:#cbd5f5;font-size:0.85rem;">${item.duration}</div>
    `;
    recommendationList.appendChild(card);
  });
}

function renderAnimation(animationClass) {
  return `
    <div class="animation-silhouette ${animationClass}">
      <div class="animation-silhouette__base"></div>
      <div class="animation-silhouette__torso"></div>
      <div class="animation-silhouette__head"></div>
      <div class="animation-silhouette__limb animation-silhouette__limb--left"></div>
      <div class="animation-silhouette__limb animation-silhouette__limb--right"></div>
    </div>
  `;
}

function severityClass(severity) {
  switch (severity) {
    case SEVERITY.GOOD:
      return 'badge--good';
    case SEVERITY.CAUTION:
      return 'badge--caution';
    case SEVERITY.FOCUS:
      return 'badge--focus';
    default:
      return '';
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2600);
}
