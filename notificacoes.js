// ==========================================
// KUDURO PRIME 👑
// SISTEMA DE NOTIFICAÇÕES
// ETAPA 1 — FIRESTORE
// ==========================================

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ==========================================
// FIREBASE
// ==========================================

const firebaseConfig = {

  apiKey:
    "AIzaSyDoitCcLeLDNBNPCP6fG1s_xbHr4UmohSo",

  authDomain:
    "kuduro-prime.firebaseapp.com",

  projectId:
    "kuduro-prime",

  storageBucket:
    "kuduro-prime.firebasestorage.app",

  messagingSenderId:
    "299776559545",

  appId:
    "1:299776559545:web:04aced1ba25391eb3fce68"

};


// ==========================================
// EVITAR FIREBASE DUPLICADO
// ==========================================

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);


// ==========================================
// ELEMENTOS
// ==========================================

const notificationBtn =
  document.querySelector("#notificationBtn");

const notificationPanel =
  document.querySelector("#notificationPanel");

const notificationBadge =
  document.querySelector("#notificationBadge");

const notificationList =
  document.querySelector("#notificationList");

const markAllReadBtn =
  document.querySelector("#markAllReadBtn");

const enableNotificationsBtn =
  document.querySelector("#enableNotificationsBtn");


// ==========================================
// UTILITÁRIO
// ==========================================

function escaparHTML(texto){

  if(!texto){
    return "";
  }

  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ==========================================
// TEMPO DA NOTIFICAÇÃO
// ==========================================

function tempoNotificacao(timestamp){

  if(!timestamp){
    return "Agora";
  }

  let data;

  try{

    data = timestamp.toDate();

  }catch(error){

    return "Agora";

  }

  const agora =
    new Date();

  const segundos =
    Math.floor(
      (agora - data) / 1000
    );

  if(segundos < 60){
    return "Agora";
  }

  const minutos =
    Math.floor(
      segundos / 60
    );

  if(minutos < 60){

    return `${minutos} min`;

  }

  const horas =
    Math.floor(
      minutos / 60
    );

  if(horas < 24){

    return `${horas} h`;

  }

  const dias =
    Math.floor(
      horas / 24
    );

  if(dias < 7){

    return `${dias} d`;

  }

  return data.toLocaleDateString(
    "pt-PT"
  );

}


// ==========================================
// MOSTRAR NOTIFICAÇÕES
// ==========================================

function mostrarNotificacoes(
  notificacoes
){

  if(!notificationList){
    return;
  }


  // ========================================
  // SEM NOTIFICAÇÕES
  // ========================================

  if(notificacoes.length === 0){

    notificationList.innerHTML = `

      <div class="notification-empty">

        🔔

        <br><br>

        Ainda não tens notificações.

      </div>

    `;

    if(notificationBadge){

      notificationBadge.classList.remove(
        "show"
      );

      notificationBadge.textContent =
        "0";

    }

    return;
  }


  // ========================================
  // CONTAR NÃO LIDAS
  // ========================================

  const naoLidas =
    notificacoes.filter(
      item =>
        item.data.read !== true
    ).length;


  if(notificationBadge){

    if(naoLidas > 0){

      notificationBadge.textContent =
        naoLidas > 99
          ? "99+"
          : naoLidas;

      notificationBadge.classList.add(
        "show"
      );

    }else{

      notificationBadge.classList.remove(
        "show"
      );

    }

  }


  // ========================================
  // GERAR HTML
  // ========================================

  notificationList.innerHTML =
    notificacoes
      .map(item => {

        const n =
          item.data;

        const titulo =
          escaparHTML(
            n.title ||
            "Nova notificação"
          );

        const corpo =
          escaparHTML(
            n.body ||
            ""
          );

        const foto =
          n.actorPhoto ||
          "";

        const tempo =
          tempoNotificacao(
            n.createdAt
          );

        const url =
          escaparHTML(
            n.url ||
            "feed.html"
          );


        return `

          <div
            class="notification-item ${
              n.read === true
                ? ""
                : "unread"
            }"
            data-id="${item.id}"
            data-url="${url}"
          >

            <div class="notification-avatar">

              ${
                foto

                  ? `<img
                      src="${escaparHTML(foto)}"
                      alt=""
                    >`

                  : "👤"
              }

            </div>


            <div class="notification-content">

              <div class="notification-title">

                ${titulo}

              </div>


              <div class="notification-text">

                ${corpo}

              </div>


              <div class="notification-time">

                ${tempo}

              </div>

            </div>

          </div>

        `;

      })
      .join("");


  // ========================================
  // CLIQUE NA NOTIFICAÇÃO
  // ========================================

  document
    .querySelectorAll(
      ".notification-item"
    )
    .forEach(item => {

      item.addEventListener(
        "click",
        async () => {

          const id =
            item.dataset.id;

          const url =
            item.dataset.url ||
            "feed.html";


          try{

            await updateDoc(
              doc(
                db,
                "notificacoes",
                id
              ),
              {
                read: true
              }
            );

          }catch(error){

            console.error(
              "Erro ao marcar notificação:",
              error
            );

          }


          window.location.href =
            url;

        }
      );

    });

}


// ==========================================
// INICIAR NOTIFICAÇÕES
// ==========================================

let pararNotificacoes = null;


function iniciarNotificacoes(user){

  if(!user){
    return;
  }


  console.log(
    "🔔 Notificações iniciadas para:",
    user.uid
  );


  const notificacoesRef =
    collection(
      db,
      "notificacoes"
    );


  const q =
    query(

      notificacoesRef,

      where(
        "recipientId",
        "==",
        user.uid
      ),

      orderBy(
        "createdAt",
        "desc"
      ),

      limit(50)

    );


  pararNotificacoes =
    onSnapshot(

      q,

      snapshot => {

        const notificacoes =
          snapshot.docs.map(
            documento => ({

              id:
                documento.id,

              data:
                documento.data()

            })
          );


        mostrarNotificacoes(
          notificacoes
        );

      },


      error => {

        console.error(
          "Erro ao carregar notificações:",
          error
        );


        if(notificationList){

          notificationList.innerHTML = `

            <div class="notification-empty">

              ⚠️ Erro ao carregar notificações.

              <br><br>

              Verifica as Firestore Rules
              e o índice do Firestore.

            </div>

          `;

        }

      }

    );

}


// ==========================================
// MARCAR TODAS COMO LIDAS
// ==========================================

if(markAllReadBtn){

  markAllReadBtn.addEventListener(
    "click",
    async () => {

      const user =
        auth.currentUser;


      if(!user){
        return;
      }


      try{

        const q =
          query(

            collection(
              db,
              "notificacoes"
            ),

            where(
              "recipientId",
              "==",
              user.uid
            ),

            limit(50)

          );


        const snapshot =
          await new Promise(
            (resolve, reject) => {

              const unsubscribe =
                onSnapshot(

                  q,

                  data => {

                    unsubscribe();

                    resolve(data);

                  },

                  error => {

                    unsubscribe();

                    reject(error);

                  }

                );

            }
          );


        const batch =
          writeBatch(db);


        let quantidade =
          0;


        snapshot.docs.forEach(
          documento => {

            if(
              documento.data().read !== true
            ){

              batch.update(
                documento.ref,
                {
                  read: true
                }
              );

              quantidade++;

            }

          }
        );


        if(quantidade > 0){

          await batch.commit();

        }


        console.log(
          "✅ Notificações marcadas como lidas:",
          quantidade
        );


      }catch(error){

        console.error(
          "❌ Erro ao marcar notificações:",
          error
        );

      }

    }
  );

}


// ==========================================
// BOTÃO ATIVAR NOTIFICAÇÕES
// ==========================================

if(enableNotificationsBtn){

  enableNotificationsBtn.addEventListener(
    "click",
    () => {

      alert(
        "🔔 As notificações internas do KUDURO PRIME já estão a ser configuradas. As notificações push para o telemóvel serão adicionadas numa próxima etapa."
      );

    }
  );

}


// ==========================================
// LOGIN
// ==========================================

onAuthStateChanged(
  auth,
  user => {

    // ======================================
    // PARAR LISTENER ANTERIOR
    // ======================================

    if(pararNotificacoes){

      pararNotificacoes();

      pararNotificacoes =
        null;

    }


    // ======================================
    // UTILIZADOR LOGADO
    // ======================================

    if(user){

      iniciarNotificacoes(
        user
      );

    }else{

      if(notificationBadge){

        notificationBadge.classList.remove(
          "show"
        );

        notificationBadge.textContent =
          "0";

      }


      if(notificationList){

        notificationList.innerHTML = `

          <div class="notification-empty">

            🔔

            <br><br>

            Entra na tua conta para
            veres as notificações.

          </div>

        `;

      }

    }

  }
);
