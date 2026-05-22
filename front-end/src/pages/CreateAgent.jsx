import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAgent } from '../api/agents'
import { logout } from '../api/api'
import { AppNav } from '../components/AppNav'

const MODELS = [
  "Claude 3.5 Sonnet",
  "GPT-4o",
  "GPT-4.1",
]

const CreateAgent = () => {
  const navigate = useNavigate()

  const [config, setConfig] = useState({
    name: '',
    instructions: '',
    model: 'Claude 3.5 Sonnet',
    maxSteps: 5,
    forbiddenTopics: '',
  })

  const [maxStepsInput, setMaxStepsInput] = useState('5')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {

    if (!config.name.trim()) {
      alert("Enter agent name")
      return
    }

    if (!config.instructions.trim()) {
      alert("Enter instructions")
      return
    }

    try {

      setLoading(true)

      const payload = {
        name: config.name,
        system_prompt: config.instructions,
        tools: [],
      }

      await createAgent(payload)

      alert("Agent created — open Live to run it")

      setConfig({
        name: '',
        instructions: '',
        model: 'Claude 3.5 Sonnet',
        maxSteps: 5,
        forbiddenTopics: '',
      })

      setMaxStepsInput('5')

    } catch (err) {

      console.error(err)

      alert(
        err.message ||
        "Failed to create agent"
      )

    } finally {

      setLoading(false)

    }

  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const canSave =
    config.name.trim() &&
    config.instructions.trim() &&
    !loading

  return (

    <div style={styles.root}>

      <div style={styles.topBar}>

        <div style={styles.logoBadge}>
          Agentic
          <span style={{ color:'#b3f0ff' }}>
            Studio
          </span>
        </div>

        <AppNav />

        <div style={{ position:'relative' }}>

          <div
            style={styles.profileBar}
            onClick={() =>
              setShowProfileMenu(
                !showProfileMenu
              )
            }
          >
            Profile
          </div>

          {showProfileMenu && (

            <div style={styles.popup}>

              <div
                style={styles.popupItem}
                onClick={handleLogout}
              >
                Logout
              </div>

            </div>

          )}

        </div>

      </div>

      <div style={styles.scroll}>

        <div style={styles.card}>

          <div style={styles.section}>

            <label style={styles.label}>
              Name
            </label>

            <input
              value={config.name}
              onChange={e =>
                setConfig({
                  ...config,
                  name:e.target.value,
                })
              }
              style={styles.input}
            />

          </div>

          <div style={styles.section}>

            <label style={styles.label}>
              Instructions
            </label>

            <textarea
              rows={7}
              value={config.instructions}
              onChange={e =>
                setConfig({
                  ...config,
                  instructions:e.target.value,
                })
              }
              style={styles.textarea}
            />

          </div>

          <div style={styles.section}>

            <label style={styles.label}>
              Model
            </label>

            <div
              style={{
                display:'flex',
                gap:8,
                flexWrap:'wrap',
              }}
            >

              {MODELS.map(model => (

                <div
                  key={model}
                  onClick={() =>
                    setConfig({
                      ...config,
                      model,
                    })
                  }
                  style={{
                    ...styles.modelChip,

                    background:
                      config.model === model
                      ? 'rgba(255,255,255,.25)'
                      : 'rgba(0,0,0,.2)',

                    border:
                      config.model === model
                      ? '1px solid rgba(255,255,255,.5)'
                      : '1px solid rgba(255,255,255,.1)',
                  }}
                >

                  {model}

                </div>

              ))}

            </div>

          </div>

          <div style={styles.section}>

            <label style={styles.label}>
              Max Iterations
            </label>

            <input
              type="number"
              min={1}
              max={20}
              value={maxStepsInput}
              style={{
                ...styles.input,
                width:120,
              }}
              onChange={e =>
                setMaxStepsInput(
                  e.target.value
                )
              }
              onBlur={() => {

                const val =
                  Math.min(
                    20,
                    Math.max(
                      1,
                      Number(
                        maxStepsInput
                      ) || 1
                    )
                  )

                setMaxStepsInput(
                  String(val)
                )

                setConfig({
                  ...config,
                  maxSteps:val,
                })

              }}
            />

          </div>

          <div style={styles.section}>

            <label style={styles.label}>
              Forbidden Topics
            </label>

            <input
              value={
                config.forbiddenTopics
              }
              placeholder="politics, violence..."
              style={styles.input}
              onChange={e =>
                setConfig({
                  ...config,
                  forbiddenTopics:
                  e.target.value,
                })
              }
            />

          </div>

        </div>

      </div>

      <button
        disabled={!canSave}
        onClick={handleSave}
        style={{
          ...styles.saveBtn,

          opacity:
            canSave
            ? 1
            : .5,
        }}
      >

        {
          loading
          ? "Saving..."
          : "Save agent"
        }

      </button>

    </div>

  )

}

const styles = {

root:{
display:'flex',
flexDirection:'column',
height:'100vh',
padding:12,
gap:10,
boxSizing:'border-box',

background:
'linear-gradient(160deg,#5ececa 0%,#3a9fbf 40%,#1a6080 100%)',

color:'#fff',

fontFamily:
'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
},

topBar:{
display:'flex',
justifyContent:'space-between',
alignItems:'center',
},

logoBadge:{
padding:'8px 16px',
borderRadius:12,

background:
'rgba(255,255,255,.15)',

fontWeight:700,
},

profileBar:{
padding:'8px 14px',

background:
'rgba(255,255,255,.15)',

borderRadius:20,

cursor:'pointer',
},

popup:{
position:'absolute',

right:0,

top:'110%',

padding:8,

borderRadius:12,

background:
'rgba(25,45,60,.95)',
},

popupItem:{
cursor:'pointer',

padding:10,
},

scroll:{
flex:1,
overflowY:'auto',
},

card:{
padding:16,

borderRadius:16,

background:
'rgba(255,255,255,.08)',
},

section:{
marginBottom:20,
},

label:{
display:'block',

marginBottom:8,

fontWeight:700,
},

input:{
width:'100%',

padding:12,

borderRadius:10,

border:'none',

background:
'rgba(0,0,0,.2)',

color:'#fff',

boxSizing:'border-box',
},

textarea:{
width:'100%',

padding:12,

borderRadius:10,

border:'none',

background:
'rgba(0,0,0,.2)',

color:'#fff',

boxSizing:'border-box',

resize:'vertical',
},

modelChip:{
padding:'8px 14px',

borderRadius:20,

cursor:'pointer',
},

saveBtn:{
padding:16,

border:'none',

borderRadius:12,

cursor:'pointer',

fontWeight:700,

color:'#fff',

background:
'rgba(255,255,255,.2)',
},

}

export default CreateAgent