// ==========================================
// KUDURO PRIME 👑
// SISTEMA DE NOTIFICAÇÕES
// ETAPA 1 — FIRESTORE
// ==========================================

import {
  initializeApp
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


const app =
  initializeApp(firebaseConfig);

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
// UTILITÁRIOS
// ==========================================

function escaparHTML(texto){

  if(!texto){
    return "";
  }

  return String(texto)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


// ==========================================
// DATA DA NOTIFICAÇÃO
// ==========================================

function tempoNotificacao(timestamp){

  if(!timestamp){
    return "Agora";
  }

  const data =
    timestamp.toDate();

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
    Math.floor(segundos / 60);

  if(minutos < 60){
    return `${minutos} min`;
  }

  const horas =
    Math.floor(minutos / 60);

  if(horas < 24){
    return `${horas} h`;
  }

  const dias =
    Math.floor(horas / 24);

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
      n => n.data.read !== true
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
  // HTML
  // ========================================

  notificationList.innerHTML =

    notificacoes.map(item => {

      const n =
        item.data;

      const nome =
        escaparHTML(
          n.actorName ||
          "Alguém"
        );

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
        n.actorPhoto || "";

      const tempo =
        tempoNotificacao(
          n.createdAt
        );


      return `

        <div
          class="notification-item
          ${n.read === true ? "" : "unread"}"
          data-id="${item.id}"
          data-url="${escaparHTML(
            n.url || "feed.html"
          )}"
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

    }).join("");


  // ========================================
  // CLIQUE
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
                read:true
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
// CARREGAR NOTIFICAÇÕES
// ==========================================

function iniciarNotificacoes(
  user
){

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

            Verifica as Firestore Rules.

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
            (resolve,reject) => {

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


        snapshot.docs.forEach(
          documento => {

            if(
              documento.data().read !== true
            ){

              batch.update(
                documento.ref,
                {
                  read:true
                }
              );

            }

          }
        );


        await batch.commit();


        console.log(
          "✅ Todas as notificações foram marcadas como lidas."
        );

      }catch(error){

        console.error(
          "Erro:",
          error
        );

      }

    }
  );

}


// ==========================================
// BOTÃO ATIVAR
// ==========================================

if(enableNotificationsBtn){

  enableNotificationsBtn.addEventListener(
    "click",
    () => {

      alert(
        "🔔 A ativação das notificações push será feita numa próxima etapa. Por enquanto estamos a configurar as notificações internas do KUDURO PRIME."
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

    if(user){

      iniciarNotificacoes(
        user
      );

    }

  }
);
