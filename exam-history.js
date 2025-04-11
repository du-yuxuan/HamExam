/**
 * HamExam - 业余无线电台操作能力考核A类模拟考试历史记录
 * 本文件包含考试历史记录的保存、加载和显示功能
 */

/**
 * 保存考试历史记录
 * 将考试结果保存到localStorage中
 *
 * @param {Object} examData - 考试数据对象
 */
function saveExamHistory(examData) {
    // 从localStorage获取现有的历史记录
    let examHistory = JSON.parse(localStorage.getItem('hamExamHistory')) || [];

    // 添加新的考试记录
    examHistory.push(examData);

    // 限制历史记录数量，最多保存20条
    if (examHistory.length > 20) {
        examHistory = examHistory.slice(examHistory.length - 20);
    }

    // 保存到localStorage
    localStorage.setItem('hamExamHistory', JSON.stringify(examHistory));
}

/**
 * 加载考试历史记录
 * 从localStorage中获取保存的考试历史
 *
 * @returns {Array} 考试历史记录数组
 */
function loadExamHistory() {
    return JSON.parse(localStorage.getItem('hamExamHistory')) || [];
}

/**
 * 清空考试历史记录
 */
function clearExamHistory() {
    localStorage.removeItem('hamExamHistory');
}

/**
 * 渲染考试历史记录列表
 * 在历史记录模态框中显示考试历史
 */
function renderExamHistory() {
    const historyContainer = document.getElementById('history-list');
    const examHistory = loadExamHistory();

    // 清空容器
    historyContainer.innerHTML = '';

    if (examHistory.length === 0) {
        historyContainer.innerHTML = '<div class="notification is-light">暂无考试历史记录</div>';
        return;
    }

    // 为每条历史记录创建一个条目，反转数组以便最新的记录显示在最顶部
    [...examHistory].reverse().forEach((record, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'box';

        // 计算完成率
        const totalQuestions = record.totalQuestions;
        const answeredQuestions = Object.keys(record.userAnswers).length;
        const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);
        const isCompleted = answeredQuestions === totalQuestions;

        // 创建历史记录内容
        historyItem.innerHTML = `
            <div class="columns is-vcentered">
                <div class="column">
                    <h4 class="title is-5">${record.date}</h4>
                    <p>得分: ${record.score.correct}/${totalQuestions}</p>
                    <p>用时: ${record.timeUsed}</p>
                </div>
                <div class="column has-text-right">
                    <span class="tag ${isCompleted ? 'is-success' : 'is-warning'}">
                        ${isCompleted ? '已完成' : '未完成'} (${completionRate}%)
                    </span>
                    <button class="button is-info is-small view-history-btn" data-index="${index}">
                        <span class="icon is-small"><i class="fas fa-eye"></i></span>
                        <span>查看</span>
                    </button>
                </div>
            </div>
        `;

        historyContainer.appendChild(historyItem);
    });

    // 为查看详情按钮添加事件监听器
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            viewExamHistoryDetail(examHistory[index]);
        });
    });
}

/**
 * 查看考试历史详情
 * 显示特定考试记录的详细信息
 *
 * @param {Object} examRecord - 考试记录对象
 */
function viewExamHistoryDetail(examRecord) {
    // 隐藏历史列表模态框
    document.getElementById('history-modal').classList.remove('is-active');

    // 显示历史详情模态框
    const detailModal = document.getElementById('history-detail-modal');
    detailModal.classList.add('is-active');

    // 更新模态框标题
    document.getElementById('history-detail-title').textContent = `考试详情 - ${examRecord.date}`;

    // 更新考试信息
    const infoContainer = document.getElementById('history-detail-info');
    infoContainer.innerHTML = `
        <div class="content">
            <p><strong>日期:</strong> ${examRecord.date}</p>
            <p><strong>得分:</strong> ${examRecord.score.correct}/${examRecord.totalQuestions}</p>
            <p><strong>用时:</strong> ${examRecord.timeUsed}</p>
            <p><strong>正确题数:</strong> ${examRecord.score.correct}</p>
            <p><strong>错误题数:</strong> ${examRecord.score.incorrect}</p>
        </div>
    `;

    // 添加筛选按钮
    const filterContainer = document.getElementById('history-detail-filters');
    filterContainer.innerHTML = `
        <div class="field is-grouped is-grouped-centered">
            <p class="control">
                <button id="history-show-all" class="button is-info is-small is-active">
                    <span class="icon is-small"><i class="fas fa-list"></i></span>
                    <span>所有题目</span>
                </button>
            </p>
            <p class="control">
                <button id="history-show-correct" class="button is-success is-small">
                    <span class="icon is-small"><i class="fas fa-check"></i></span>
                    <span>正确题目</span>
                </button>
            </p>
            <p class="control">
                <button id="history-show-incorrect" class="button is-danger is-small">
                    <span class="icon is-small"><i class="fas fa-times"></i></span>
                    <span>错误题目</span>
                </button>
            </p>
            <p class="control">
                <button id="history-show-unanswered" class="button is-warning is-small">
                    <span class="icon is-small"><i class="fas fa-question"></i></span>
                    <span>未作答</span>
                </button>
            </p>
        </div>
    `;

    // 为筛选按钮添加事件监听器
    document.getElementById('history-show-all').addEventListener('click', () => {
        setActiveFilterButton('history-show-all');
        renderHistoryQuestions(examRecord, 'all');
    });

    document.getElementById('history-show-correct').addEventListener('click', () => {
        setActiveFilterButton('history-show-correct');
        renderHistoryQuestions(examRecord, 'correct');
    });

    document.getElementById('history-show-incorrect').addEventListener('click', () => {
        setActiveFilterButton('history-show-incorrect');
        renderHistoryQuestions(examRecord, 'incorrect');
    });

    document.getElementById('history-show-unanswered').addEventListener('click', () => {
        setActiveFilterButton('history-show-unanswered');
        renderHistoryQuestions(examRecord, 'unanswered');
    });

    // 默认显示所有题目
    renderHistoryQuestions(examRecord, 'all');
}

/**
 * 设置活动的筛选按钮
 *
 * @param {string} activeButtonId - 活动按钮的ID
 */
function setActiveFilterButton(activeButtonId) {
    const filterButtons = [
        'history-show-all',
        'history-show-correct',
        'history-show-incorrect',
        'history-show-unanswered'
    ];

    filterButtons.forEach(id => {
        const button = document.getElementById(id);
        if (id === activeButtonId) {
            button.classList.add('is-active');
        } else {
            button.classList.remove('is-active');
        }
    });
}

/**
 * 渲染历史考试题目
 *
 * @param {Object} examRecord - 考试记录对象
 * @param {string} mode - 筛选模式：'all', 'correct', 'incorrect', 'unanswered'
 */
function renderHistoryQuestions(examRecord, mode) {
    const questionsContainer = document.getElementById('history-detail-questions');
    questionsContainer.innerHTML = '';

    // 遍历所有题目
    examRecord.questions.forEach((q, index) => {
        const userAnswer = examRecord.userAnswers[index];
        const isCorrect = userAnswer === q.correct;
        const isAnswered = userAnswer !== undefined;

        // 根据筛选模式决定是否显示
        if (
            (mode === 'correct' && !isCorrect) ||
            (mode === 'incorrect' && (isCorrect || !isAnswered)) ||
            (mode === 'unanswered' && isAnswered)
        ) {
            return;
        }

        // 创建题目卡片
        const card = document.createElement('div');
        let cardClass = 'box question-card';

        if (isAnswered) {
            cardClass += isCorrect ? ' has-background-success-light' : ' has-background-danger-light';
        } else {
            cardClass += ' has-background-warning-light';
        }

        card.className = cardClass;

        // 创建题目标题
        const questionTitle = document.createElement('h3');
        questionTitle.className = 'subtitle';
        questionTitle.innerHTML = `<span class="has-text-weight-bold">${index + 1}.</span> ${q.question.replace(/^\d+\.\s*\[\w+\]/, '')}`;
        card.appendChild(questionTitle);

        // 创建选项列表
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'content';

        // 为每个选项创建标签
        q.options.forEach((opt, i) => {
            const optionLabel = document.createElement('div');
            optionLabel.className = 'option-label';

            // 根据答案状态设置样式
            if (i === q.correct) {
                optionLabel.classList.add('correct');
            } else if (i === userAnswer && !isCorrect) {
                optionLabel.classList.add('incorrect');
            }

            optionLabel.innerHTML = `${String.fromCharCode(65 + i)}. ${opt} ${i === q.correct ? '<span class="icon has-text-success"><i class="fas fa-check"></i></span>' : ''}`;
            optionsContainer.appendChild(optionLabel);
        });

        card.appendChild(optionsContainer);

        // 添加解析
        const explanation = document.createElement('div');
        explanation.className = 'notification is-light';
        explanation.innerHTML = `<strong>解析:</strong> ${q.explanation}`;
        card.appendChild(explanation);

        // 添加用户答案状态
        const answerStatus = document.createElement('div');
        answerStatus.className = 'has-text-right';

        if (!isAnswered) {
            answerStatus.innerHTML = '<span class="tag is-warning">未作答</span>';
        } else if (isCorrect) {
            answerStatus.innerHTML = '<span class="tag is-success">回答正确</span>';
        } else {
            answerStatus.innerHTML = `<span class="tag is-danger">回答错误</span> <span class="has-text-weight-bold">您的答案: ${String.fromCharCode(65 + userAnswer)}</span>`;
        }

        card.appendChild(answerStatus);
        questionsContainer.appendChild(card);
    });
}
