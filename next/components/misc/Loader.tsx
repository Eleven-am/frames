import ss from './Loading.module.css';

export function Loading() {
    return (
       <div className={ss.bb1}>
           <div className={ss.bb2}>
               <div className={ss.circle}/>
               <div className={ss.circle}/>
           </div>
       </div>
    )
}