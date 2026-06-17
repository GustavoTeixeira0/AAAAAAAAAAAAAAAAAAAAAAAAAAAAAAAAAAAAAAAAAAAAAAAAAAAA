document.querySelectorAll('.cpf-mask').forEach(input => {
    input.addEventListener('input', function() {
        let cpf = this.value.replace(/\D/g, '');

        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        this.value = cpf;
    });
});

const STORAGE_KEY = 'sge-usuarios';
const SESSION_KEY = 'sge-usuario-logado';

function carregarUsuarios() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function salvarUsuarios(usuarios) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

function carregarSessao() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

function salvarSessao(usuario) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

function limparSessao() {
    localStorage.removeItem(SESSION_KEY);
}

function mostrarMensagem(id, mensagem, tipo = 'danger') {
    const elemento = document.getElementById(id);
    if (!elemento) {
        console.warn(`Elemento de mensagem não encontrado: ${id}`);
        return;
    }
    elemento.textContent = mensagem;
    elemento.className = `msg text-${tipo}`;
}

function validarCPF(cpf) {
    const apenasDigitos = cpf.replace(/\D/g, '');
    return apenasDigitos.length === 11;
}

function limparCpf(cpf) {
    return cpf.replace(/\D/g, '');
}

function fazerLogin() {
    const rawCpf = document.getElementById('loginCpf').value;
    const cpf = limparCpf(rawCpf);
    const senha = document.getElementById('loginSenha').value;
    const escola = document.getElementById('loginEscola').value.trim();

    if (!validarCPF(rawCpf)) {
        mostrarMensagem('msgLogin', 'CPF inválido. Use 11 dígitos.', 'danger');
        return;
    }

    if (!senha) {
        mostrarMensagem('msgLogin', 'Informe sua senha.', 'danger');
        return;
    }

    if (!escola) {
        mostrarMensagem('msgLogin', 'Informe a escola.', 'danger');
        return;
    }

    const usuarios = carregarUsuarios();
    const usuario = usuarios.find(u => limparCpf(u.cpf) === cpf && u.escola.toLowerCase() === escola.toLowerCase());

    if (!usuario) {
        mostrarMensagem('msgLogin', 'Usuário não encontrado. Verifique CPF e escola.', 'danger');
        return;
    }

    if (usuario.senha !== senha) {
        mostrarMensagem('msgLogin', 'Senha incorreta.', 'danger');
        return;
    }

    salvarSessao({ cpf: usuario.cpf, escola: usuario.escola, tipo: usuario.tipo });
    mostrarMensagem('msgLogin', `Bem-vindo(a), ${usuario.tipo}! Sessão iniciada.`, 'success');
    renderSessao();
}

function cadastrar() {
    const rawCpf = document.getElementById('cadCpf').value;
    const cpf = limparCpf(rawCpf);
    const senha = document.getElementById('cadSenha').value;
    const escola = document.getElementById('cadEscola').value.trim();
    const tipo = document.getElementById('cadTipo').value;

    if (!validarCPF(rawCpf)) {
        mostrarMensagem('msgCadastro', 'CPF inválido. Use 11 dígitos.', 'danger');
        return;
    }

    if (!senha || !escola || !tipo) {
        mostrarMensagem('msgCadastro', 'Preencha todos os campos corretamente.', 'danger');
        return;
    }

    const usuarios = carregarUsuarios();
    const jaExiste = usuarios.some(u => limparCpf(u.cpf) === cpf && u.escola.toLowerCase() === escola.toLowerCase());

    if (jaExiste) {
        mostrarMensagem('msgCadastro', 'Já existe uma conta registrada com este CPF e escola.', 'danger');
        return;
    }

    usuarios.push({ cpf, senha, escola, tipo });
    salvarUsuarios(usuarios);
    mostrarMensagem('msgCadastro', 'Cadastro concluído com sucesso! Agora faça o login.', 'success');
    document.getElementById('cadSenha').value = '';
    document.getElementById('cadTipo').value = '';
}

function renderSessao() {
    const sessao = carregarSessao();
    const sessionArea = document.getElementById('sessionArea');
    const loginCardFields = document.getElementById('loginCardFields');
    const sessionUsuario = document.getElementById('sessionUsuario');
    const navUserInfo = document.getElementById('navUserInfo');

    if (sessao) {
        if (loginCardFields) loginCardFields.classList.add('hidden');
        if (sessionArea) sessionArea.classList.remove('hidden');
        if (sessionUsuario) sessionUsuario.textContent = `Logado como ${sessao.tipo} na escola ${sessao.escola} (CPF ${sessao.cpf}).`;
        if (navUserInfo) {
            navUserInfo.textContent = `${sessao.tipo} | CPF ${sessao.cpf}`;
            navUserInfo.classList.remove('hidden');
        }
        mostrarMensagem('msgLogin', 'Sessão ativa.', 'success');
    } else {
        if (loginCardFields) loginCardFields.classList.remove('hidden');
        if (sessionArea) sessionArea.classList.add('hidden');
        if (sessionUsuario) sessionUsuario.textContent = '';
        if (navUserInfo) {
            navUserInfo.textContent = '';
            navUserInfo.classList.add('hidden');
        }
        const msgLogin = document.getElementById('msgLogin');
        if (msgLogin) msgLogin.textContent = '';
    }
}

function carregarNotas() {
    const raw = localStorage.getItem('sge-notas');
    return raw ? JSON.parse(raw) : {};
}

function salvarNotas(notas) {
    localStorage.setItem('sge-notas', JSON.stringify(notas));
}

function getNotasAluno(cpf) {
    const notas = carregarNotas();
    return notas[cpf] || {};
}

function salvarNotasAluno() {
    const sessao = carregarSessao();
    if (!sessao || sessao.tipo !== 'Professor') {
        mostrarMensagem('msgNotas', 'Apenas professores podem salvar notas.', 'danger');
        return;
    }

    const rawCpf = document.getElementById('selectedAlunoCpf')?.value || '';
    const cpf = limparCpf(rawCpf);

    if (!validarCPF(rawCpf)) {
        mostrarMensagem('msgNotas', 'Informe um CPF válido do aluno.', 'danger');
        return;
    }

    const notasAluno = {};
    const materias = ['Português', 'História', 'Geografia', 'Ciência', 'Matemática', 'Educação Física', 'Arte'];
    const bimestres = [1, 2, 3, 4];

    materias.forEach((materia, mIndex) => {
        notasAluno[materia] = {};
        bimestres.forEach(bimestre => {
            const input = document.getElementById(`grade-${mIndex}-${bimestre}`);
            if (input) {
                notasAluno[materia][bimestre] = input.value.trim() || '';
            }
        });
    });

    const notas = carregarNotas();
    notas[cpf] = notasAluno;
    salvarNotas(notas);

    mostrarMensagem('msgNotas', 'Notas salvas com sucesso.', 'success');
}

function renderNotasAluno() {
    const container = document.getElementById('gradesContainer');
    const msgNotas = document.getElementById('msgNotas');
    const cfg = document.getElementById('notasAlunoConfig');
    const sessao = carregarSessao();
    const materias = ['Português', 'História', 'Geografia', 'Ciência', 'Matemática', 'Educação Física', 'Arte'];
    const bimestres = [1, 2, 3, 4];

    if (!container) return;

    if (!sessao) {
        container.innerHTML = '';
        if (cfg) cfg.classList.add('hidden');
        if (msgNotas) mostrarMensagem('msgNotas', 'Faça login para ver as notas.', 'danger');
        return;
    }

    const isProfessor = sessao.tipo === 'Professor';
    if (cfg) cfg.classList.toggle('hidden', !isProfessor);

    let alunoCpf = limparCpf(sessao.cpf);
    if (isProfessor) {
        const rawCpf = document.getElementById('selectedAlunoCpf')?.value || '';
        if (!validarCPF(rawCpf)) {
            if (msgNotas) mostrarMensagem('msgNotas', 'Informe um CPF válido do aluno.', 'danger');
            container.innerHTML = '';
            return;
        }
        alunoCpf = limparCpf(rawCpf);
    }

    if (msgNotas) msgNotas.textContent = '';
    const notasAluno = getNotasAluno(alunoCpf);

    let html = '<table class="grades-table"><thead><tr><th>Matéria</th>';
    bimestres.forEach(b => {
        html += `<th>Bimestre ${b}</th>`;
    });
    html += '</tr></thead><tbody>';

    materias.forEach((materia, mIndex) => {
        html += `<tr><th>${materia}</th>`;
        bimestres.forEach(bimestre => {
            const valor = notasAluno[materia]?.[bimestre] || '';
            if (isProfessor) {
                html += `<td><input id="grade-${mIndex}-${bimestre}" type="text" value="${valor}" placeholder="" maxlength="4"></td>`;
            } else {
                html += `<td>${valor || '-'}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function listarAlunosDaEscola() {
    const sessao = carregarSessao();
    if (!sessao || sessao.tipo !== 'Professor') {
        return [];
    }

    const usuarios = carregarUsuarios();
    const alunosDaEscola = usuarios.filter(u => 
        u.tipo === 'Aluno' && u.escola.toLowerCase() === sessao.escola.toLowerCase()
    );

    return alunosDaEscola;
}

function abrirListaAlunos() {
    const modal = document.getElementById('listaAlunosModal');
    const container = document.getElementById('listaAlunosContainer');
    
    if (!modal || !container) return;

    const alunos = listarAlunosDaEscola();

    if (alunos.length === 0) {
        container.innerHTML = '<p style="color: #8defff; text-align: center;">Nenhum aluno encontrado nesta escola.</p>';
    } else {
        container.innerHTML = alunos.map(aluno => `
            <div class="aluno-item" onclick="selecionarAluno('${aluno.cpf}')">
                <span style="font-weight: bold;">${aluno.cpf}</span>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
}

function fecharListaAlunos() {
    const modal = document.getElementById('listaAlunosModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function selecionarAluno(cpf) {
    const input = document.getElementById('selectedAlunoCpf');
    if (input) {
        input.value = cpf;
    }
    fecharListaAlunos();
    renderNotasAluno();
}

function sair() {
    limparSessao();
    renderSessao();
    renderNotasAluno();
    mostrarMensagem('msgLogin', 'Você saiu com sucesso.', 'success');
}

renderSessao();
renderNotasAluno();
